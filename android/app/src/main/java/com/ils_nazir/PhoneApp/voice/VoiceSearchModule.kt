package com.ils_nazir.PhoneApp.voice

import android.app.Activity
import android.content.Intent
import android.speech.RecognizerIntent
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class VoiceSearchModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val SPEECH_REQUEST_CODE = 4201
    }

    private var speechPromise: Promise? = null

    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
            if (requestCode == SPEECH_REQUEST_CODE) {
                if (resultCode == Activity.RESULT_OK && data != null) {
                    val results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                    if (!results.isNullOrEmpty()) {
                        speechPromise?.resolve(results[0])
                    } else {
                        speechPromise?.resolve("")
                    }
                } else {
                    speechPromise?.resolve("")
                }
                speechPromise = null
            }
        }
    }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String = "VoiceSearchModule"

    @ReactMethod
    fun startSpeechRecognition(languageCode: String?, promise: Promise) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        speechPromise = promise

        try {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(
                    RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                    RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
                )
                val lang = languageCode ?: "hi-IN"
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang)
                putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, lang)
                putExtra(
                    RecognizerIntent.EXTRA_PROMPT,
                    if (lang.startsWith("hi", ignoreCase = true)) "बोलिए (उदा. रमेश)..." else "Speak a contact name..."
                )
            }
            activity.startActivityForResult(intent, SPEECH_REQUEST_CODE)
        } catch (e: Exception) {
            speechPromise = null
            promise.reject("SPEECH_NOT_SUPPORTED", "Speech recognition is not supported on this device", e)
        }
    }
}
