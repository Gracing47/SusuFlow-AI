# Phase 5: Mobile Mini App & "Grace"

**Objective**: Transform SusuFlow-AI into a mobile-first experience suitable for the "Mini App Track" (Farcaster) and integrate the core philosophy: *"Grace is not earned but rather a shared gift."*

## 📱 Mobile Mini App Strategy
To qualify for the Farcaster Mini App track and provide a seamless mobile experience:
1.  **Manifest & Metadata**: Add a Web App Manifest (`manifest.json`) to make the app installable and look like a native app (PWA).
2.  **Farcaster Compatibility**: Ensure the app works perfectly within the Farcaster in-app browser (webview).
3.  **Mobile UI Polish**:
    *   Bottom Navigation Bar for easier thumb reach on mobile.
    *   Touch-optimized buttons and inputs.
    *   "Grace" Themed Splash Screen.

## 🎨 Design Updates
*   **Motto Integration**: Add *"Grace is not earned but rather a shared gift"* to the footer or a dedicated "About" section.
*   **Splash Screen**: Create a loading state that reflects the "Gift/Grace" theme.

## 🛠 Implementation Steps
1.  [ ] Create `manifest.json` for PWA support.
2.  [ ] Add mobile-specific meta tags (viewport, theme-color).
3.  [ ] Refactor Navigation:
    *   Desktop: Top Navbar (existing).
    *   Mobile: Bottom Tab Bar (Home, Pools, Create, Profile).
4.  [ ] Add the "Grace" motto to the UI.
5.  [ ] Test responsiveness on small screens.
