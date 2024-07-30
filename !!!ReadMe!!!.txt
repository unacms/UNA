AFTER EXPO51

https://github.com/showtime-xyz/showtime-tab-view/issues/21

diff --git a/node_modules/@showtime-xyz/tab-view/src/gesture-container.tsx b/node_modules/@showtime-xyz/tab-view/src/gesture-container.tsx
index 3098506..07493bb 100644
--- a/node_modules/@showtime-xyz/tab-view/src/gesture-container.tsx
+++ b/node_modules/@showtime-xyz/tab-view/src/gesture-container.tsx
@@ -308,7 +308,7 @@ export const GestureContainer = React.forwardRef<
     .activeOffsetX([-width, width])
     .activeOffsetY([-10, 10])
     .onBegin(() => {
-      runOnUI(stopAllAnimation)();
+      stopAllAnimation();
     })
     .onStart(() => {
       isPullEnough.value = false;



https://www.npmjs.com/package/expo-camera

allprojects {
    repositories {

        // * Your other repositories here *

        // * Add a new maven block after other repositories / blocks *
        maven {
            // expo-camera bundles a custom com.google.android:cameraview
            url "$rootDir/../node_modules/expo-camera/android/maven"
        }
    }
}