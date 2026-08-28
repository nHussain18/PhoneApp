package com.ils_nazir.PhoneApp.calllog

import android.content.ContentResolver
import android.content.Intent
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.provider.CallLog
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class CallLogModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "CallLogModule"
    }

    private var isObserverRegistered = false

    private val callLogObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
        override fun onChange(selfChange: Boolean, uri: Uri?) {
            super.onChange(selfChange, uri)
            sendEvent("onCallLogChanged", Arguments.createMap())
        }
    }

    init {
        registerCallLogObserver()
    }

    override fun getName(): String = "CallLogModule"

    private fun registerCallLogObserver() {
        if (!isObserverRegistered) {
            try {
                reactContext.contentResolver.registerContentObserver(
                    CallLog.Calls.CONTENT_URI,
                    true,
                    callLogObserver
                )
                isObserverRegistered = true
            } catch (e: Exception) {
                Log.e(TAG, "Error registering CallLog ContentObserver", e)
            }
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }

    @ReactMethod
    fun getCallLogs(limit: Int, promise: Promise) {
        val maxResults = if (limit <= 0) 100 else limit

        val hasPermission = ContextCompat.checkSelfPermission(
            reactContext,
            android.Manifest.permission.READ_CALL_LOG
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasPermission) {
            promise.reject("PERMISSION_DENIED", "READ_CALL_LOG permission not granted")
            return
        }

        val resultList: WritableArray = Arguments.createArray()
        val projection = arrayOf(
            CallLog.Calls._ID,
            CallLog.Calls.NUMBER,
            CallLog.Calls.CACHED_NAME,
            CallLog.Calls.TYPE,
            CallLog.Calls.DATE,
            CallLog.Calls.DURATION,
            CallLog.Calls.IS_READ,
            CallLog.Calls.PHONE_ACCOUNT_ID
        )

        var cursor = try {
            reactContext.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                projection,
                null,
                null,
                "${CallLog.Calls.DATE} DESC"
            )
        } catch (e: Exception) {
            promise.reject("QUERY_ERROR", "Failed to query CallLog: ${e.localizedMessage}")
            return
        }

        cursor?.use { c ->
            val idIndex = c.getColumnIndex(CallLog.Calls._ID)
            val numberIndex = c.getColumnIndex(CallLog.Calls.NUMBER)
            val nameIndex = c.getColumnIndex(CallLog.Calls.CACHED_NAME)
            val typeIndex = c.getColumnIndex(CallLog.Calls.TYPE)
            val dateIndex = c.getColumnIndex(CallLog.Calls.DATE)
            val durationIndex = c.getColumnIndex(CallLog.Calls.DURATION)
            val isReadIndex = c.getColumnIndex(CallLog.Calls.IS_READ)
            val simIdIndex = c.getColumnIndex(CallLog.Calls.PHONE_ACCOUNT_ID)

            var count = 0
            while (c.moveToNext() && count < maxResults) {
                val item: WritableMap = Arguments.createMap()
                val id = if (idIndex >= 0) c.getString(idIndex) ?: "" else ""
                val number = if (numberIndex >= 0) c.getString(numberIndex) ?: "Unknown" else "Unknown"
                val name = if (nameIndex >= 0) c.getString(nameIndex) ?: "" else ""
                val typeInt = if (typeIndex >= 0) c.getInt(typeIndex) else CallLog.Calls.INCOMING_TYPE
                val timestamp = if (dateIndex >= 0) c.getLong(dateIndex) else 0L
                val duration = if (durationIndex >= 0) c.getLong(durationIndex) else 0L
                val isRead = if (isReadIndex >= 0) c.getInt(isReadIndex) == 1 else true
                val simId = if (simIdIndex >= 0) c.getString(simIdIndex) ?: "" else ""

                val typeString = when (typeInt) {
                    CallLog.Calls.INCOMING_TYPE -> "INCOMING"
                    CallLog.Calls.OUTGOING_TYPE -> "OUTGOING"
                    CallLog.Calls.MISSED_TYPE -> "MISSED"
                    CallLog.Calls.VOICEMAIL_TYPE -> "VOICEMAIL"
                    CallLog.Calls.REJECTED_TYPE -> "REJECTED"
                    CallLog.Calls.BLOCKED_TYPE -> "BLOCKED"
                    CallLog.Calls.ANSWERED_EXTERNALLY_TYPE -> "ANSWERED_EXTERNALLY"
                    else -> "UNKNOWN"
                }

                item.putString("id", id)
                item.putString("phoneNumber", number)
                item.putString("name", name)
                item.putString("type", typeString)
                item.putDouble("timestamp", timestamp.toDouble())
                item.putDouble("duration", duration.toDouble())
                item.putBoolean("isRead", isRead)
                item.putString("simId", simId)

                resultList.pushMap(item)
                count++
            }
        }

        promise.resolve(resultList)
    }

    @ReactMethod
    fun deleteCallLog(id: String, promise: Promise) {
        val hasPermission = ContextCompat.checkSelfPermission(
            reactContext,
            android.Manifest.permission.WRITE_CALL_LOG
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasPermission) {
            promise.reject("PERMISSION_DENIED", "WRITE_CALL_LOG permission not granted")
            return
        }

        try {
            val rowsDeleted = reactContext.contentResolver.delete(
                CallLog.Calls.CONTENT_URI,
                "${CallLog.Calls._ID} = ?",
                arrayOf(id)
            )
            promise.resolve(rowsDeleted > 0)
        } catch (e: Exception) {
            promise.reject("DELETE_ERROR", e.localizedMessage)
        }
    }

    @ReactMethod
    fun clearAllCallLogs(promise: Promise) {
        val hasPermission = ContextCompat.checkSelfPermission(
            reactContext,
            android.Manifest.permission.WRITE_CALL_LOG
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasPermission) {
            promise.reject("PERMISSION_DENIED", "WRITE_CALL_LOG permission not granted")
            return
        }

        try {
            val rowsDeleted = reactContext.contentResolver.delete(
                CallLog.Calls.CONTENT_URI,
                null,
                null
            )
            promise.resolve(rowsDeleted >= 0)
        } catch (e: Exception) {
            promise.reject("CLEAR_ERROR", e.localizedMessage)
        }
    }

    @ReactMethod
    fun makePhoneCall(phoneNumber: String, promise: Promise) {
        try {
            val hasCallPermission = ContextCompat.checkSelfPermission(
                reactContext,
                android.Manifest.permission.CALL_PHONE
            ) == PackageManager.PERMISSION_GRANTED

            val action = if (hasCallPermission) Intent.ACTION_CALL else Intent.ACTION_DIAL
            val intent = Intent(action).apply {
                data = Uri.parse("tel:${Uri.encode(phoneNumber)}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }

            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CALL_ERROR", e.localizedMessage)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Keep for RN NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep for RN NativeEventEmitter
    }

    override fun invalidate() {
        super.invalidate()
        if (isObserverRegistered) {
            try {
                reactContext.contentResolver.unregisterContentObserver(callLogObserver)
                isObserverRegistered = false
            } catch (e: Exception) {
                Log.e(TAG, "Error unregistering CallLog ContentObserver", e)
            }
        }
    }
}
