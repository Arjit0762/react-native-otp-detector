package expo.modules.otpdetector

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status

class ReactNativeOtpDetectorBroadcast(private val callback: (Intent?) -> Unit) : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("SmsBroadcastReceiver", "onReceive triggered with action: ${intent.action}")
    
        if (SmsRetriever.SMS_RETRIEVED_ACTION == intent.action) {
            Log.d("SmsBroadcastReceiver", "Received SMS_RETRIEVED_ACTION intent")
    
            val extras = intent.extras
            if (extras == null) {
                Log.e("SmsBroadcastReceiver", "No extras found in intent")
                return
            }
    
            val smsRetrieverStatus = extras.get(SmsRetriever.EXTRA_STATUS) as? Status
            if (smsRetrieverStatus == null) {
                Log.e("SmsBroadcastReceiver", "Status not found in extras")
                return
            }
    
            Log.d("SmsBroadcastReceiver", "Status received: ${smsRetrieverStatus.statusCode}")
    
            when (smsRetrieverStatus.statusCode) {
                CommonStatusCodes.SUCCESS -> {
                    Log.d("SmsBroadcastReceiver", "SMS retrieval successful")
    
                    val consentIntent = extras?.getParcelable<Intent>(SmsRetriever.EXTRA_CONSENT_INTENT)
                    if (consentIntent != null) {
                        Log.d("SmsBroadcastReceiver", "Consent Intent received, passing to callback")
                        callback(consentIntent)
                    } else {
                        Log.e("SmsBroadcastReceiver", "Consent Intent is null")
                    }
                }
    
                CommonStatusCodes.TIMEOUT -> {
                    Log.e("SmsBroadcastReceiver", "SMS retrieval timed out")
                }
    
                else -> {
                    Log.e("SmsBroadcastReceiver", "Unknown status code: ${smsRetrieverStatus.statusCode}")
                }
            }
        } else {
            Log.d("SmsBroadcastReceiver", "Received unexpected action: ${intent.action}")
        }
    }
    
}
