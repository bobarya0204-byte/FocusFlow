/**
 * Teams SSO delegation seam — not enabled in Step 2.
 * AuthProvider will call this in a later phase when TEAMS_SSO is active.
 */

/**
 * Reserved: initialize Teams-hosted SSO without prompting in Step 2.
 * @returns {Promise<null>}
 */
export async function initializeTeamsSso() {
  return null
}

/**
 * Reserved: obtain an access token inside Microsoft Teams.
 * @param {string[]} _scopes
 * @returns {Promise<string|null>}
 */
export async function acquireTeamsSsoToken(_scopes = []) {
  return null
}
