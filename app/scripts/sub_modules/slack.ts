import { httpGet, httpPostForm, getBase64Image } from './util'

export interface SessionInfo {
  api_token: string
  version_uid: string
  version_ts: string
}

export const getSessionInfo = async (
  workspaceName: string,
): Promise<SessionInfo | undefined> => {
  const emojiCustomizeUrl = `https://${workspaceName}.slack.com/customize/emoji`
  const response = await httpGet(emojiCustomizeUrl)

  if (response.url !== emojiCustomizeUrl) {
    return
  }

  const responseText = await response.text()

  const apiTokenMatches = responseText.match(/api_token: "(.+?)"/)
  if (!apiTokenMatches || !apiTokenMatches[1]) {
    return
  }

  const versionUidMatches = responseText.match(/version_uid: "(.+?)"/)
  if (!versionUidMatches || !versionUidMatches[1]) {
    return
  }

  const versionTsMatches = responseText.match(/version_ts: "(.+?)"/)
  if (!versionTsMatches || !versionTsMatches[1]) {
    return
  }

  return {
    api_token: apiTokenMatches[1],
    version_uid: versionUidMatches[1],
    version_ts: versionTsMatches[1],
  }
}

export const openLoginForm = (workspaceName: string) => {
  alert(chrome.i18n.getMessage('requestLogin', [workspaceName]))
  chrome.tabs.create({
    url: `https://${workspaceName}.slack.com`,
  })
}

const getXId = (sessionInfo: SessionInfo): string => {
  const versionUidTop = sessionInfo.version_uid.substr(0, 8)
  return `${versionUidTop}-${Date.now() / 1000}`
}

export const uploadEmoji = async (
  workspaceName: string,
  emojiName: string,
  imageUrl: string,
  sessionInfo: SessionInfo,
) => {
  const emojiCustomizeUrl = `https://${workspaceName}.slack.com/api/emoji.add?_x_id=${getXId(
    sessionInfo,
  )}`
  const formData = {
    mode: 'data',
    name: emojiName,
    image: await getBase64Image(imageUrl),
    token: sessionInfo.api_token,
  }
  const response = await httpPostForm(emojiCustomizeUrl, formData)
  if ((await response.json()).ok) {
    return true
  }
  return false
}
