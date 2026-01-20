import { NavigateFunction } from 'react-router-dom';

/**
 * Safely navigates back in history.
 * If there is history to go back to (within the app session), it uses navigate(-1).
 * Otherwise, it navigates to the specified fallback path to prevent 
 * the user from getting stuck or exiting the app context.
 * 
 * @param navigate The navigate function from useNavigate()
 * @param fallbackPath The path to navigate to if no history is available
 */
export const safeBack = (navigate: NavigateFunction, fallbackPath: string = '/') => {
    // Check if there is history. window.history.state.idx is specific to React Router v6
    // but a more universal check is if the history length is greater than 1.
    // However, if the user entered via a deep link, we might want to go to fallback.

    // Simplest logic: if we have history within the same origin, try it.
    // In many SPA contexts, we can check if the current location is the first one.

    const hasHistory = window.history.length > 1;

    if (hasHistory) {
        navigate(-1);
    } else {
        navigate(fallbackPath);
    }
};

/**
 * Checks if a route should hide navigation chrome (bottom nav/top bar).
 */
export const shouldHideNav = (pathname: string, routesToHide: string[]) => {
    return routesToHide.some(route => pathname.startsWith(route));
};
