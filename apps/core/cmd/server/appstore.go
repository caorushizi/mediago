package main

// AppStore holds all user-facing configuration options.
// Field names and defaults match the TypeScript AppStore interface
// in @mediago/shared-common.
type AppStore struct {
	Local              string `json:"local"`
	PromptTone         bool   `json:"promptTone"`
	Proxy              string `json:"proxy"`
	UseProxy           bool   `json:"useProxy"`
	DeleteSegments     bool   `json:"deleteSegments"`
	OpenInNewWindow    bool   `json:"openInNewWindow"`
	BlockAds           bool   `json:"blockAds"`
	Theme              string `json:"theme"`
	UseExtension       bool   `json:"useExtension"`
	IsMobile           bool   `json:"isMobile"`
	MaxRunner          int    `json:"maxRunner"`
	Language           string `json:"language"`
	ShowTerminal       bool   `json:"showTerminal"`
	Privacy            bool   `json:"privacy"`
	MachineId          string `json:"machineId"`
	DownloadProxySwitch bool  `json:"downloadProxySwitch"`
	AutoUpgrade        bool   `json:"autoUpgrade"`
	AllowBeta          bool   `json:"allowBeta"`
	CloseMainWindow    bool   `json:"closeMainWindow"`
	AudioMuted         bool   `json:"audioMuted"`
	EnableDocker       bool   `json:"enableDocker"`
	DockerUrl          string `json:"dockerUrl"`
	EnableMobilePlayer bool   `json:"enableMobilePlayer"`
	ApiKey             string `json:"apiKey"`
	PasswordHash       string `json:"passwordHash"`
}

// defaultAppStore returns default config values matching the TS appStoreDefaults.
func defaultAppStore() AppStore {
	return AppStore{
		Local:              "",
		PromptTone:         true,
		Proxy:              "",
		UseProxy:           false,
		DeleteSegments:     true,
		OpenInNewWindow:    false,
		BlockAds:           true,
		Theme:              "system",
		UseExtension:       false,
		IsMobile:           false,
		MaxRunner:          2,
		Language:            "system",
		ShowTerminal:       false,
		Privacy:            false,
		MachineId:          "",
		DownloadProxySwitch: false,
		AutoUpgrade:        true,
		AllowBeta:          false,
		CloseMainWindow:    false,
		AudioMuted:         true,
		EnableDocker:       false,
		DockerUrl:          "",
		EnableMobilePlayer: false,
		ApiKey:             "",
		PasswordHash:       "",
	}
}
