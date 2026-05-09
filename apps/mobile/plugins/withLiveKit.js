const { withMainApplication } = require('@expo/config-plugins');

/**
 * Custom Expo plugin to initialize LiveKit on Android.
 * This replaces the broken @livekit/react-native plugin that causes build errors.
 */
module.exports = (config) => {
  return withMainApplication(config, (config) => {
    let content = config.modResults.contents;

    // Add import if missing
    if (!content.includes('import com.livekit.reactnative.LiveKitReactNative')) {
      content = content.replace(
        /import android\.app\.Application/,
        'import android.app.Application\nimport com.livekit.reactnative.LiveKitReactNative'
      );
    }

    // Add setup call in onCreate if missing
    if (!content.includes('LiveKitReactNative.setup(this)')) {
      content = content.replace(
        /super\.onCreate\(\)/,
        'super.onCreate()\n    LiveKitReactNative.setup(this)'
      );
    }

    config.modResults.contents = content;
    return config;
  });
};
