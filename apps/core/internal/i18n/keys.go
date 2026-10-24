package i18n

// Message key constants for i18n translations.
const (
	// Common
	MsgOK                  = "common.ok"
	MsgDeleted             = "common.deleted"
	MsgImported            = "common.imported"
	MsgInvalidID           = "common.invalid_id"
	MsgInvalidRequest      = "common.invalid_request"
	MsgInternalError       = "common.internal_error"
	MsgSourcesCountInvalid = "common.sources_count_invalid"

	// Discovery
	MsgDiscoveryNotFound             = "discovery.not_found"
	MsgDiscoveryInvalidURL           = "discovery.invalid_url"
	MsgDiscoveryInvalidMode          = "discovery.invalid_mode"
	MsgDiscoveryInvalidInspectURL    = "discovery.invalid_inspect_url"
	MsgDiscoveryExecutorUnavailable  = "discovery.executor_unavailable"
	MsgDiscoveryInspectorUnavailable = "discovery.inspector_unavailable"
	MsgDiscoveryQueueFull            = "discovery.queue_full"
	MsgDiscoveryInvalidState         = "discovery.invalid_state"
	MsgDiscoverySourceNotFound       = "discovery.source_not_found"
	MsgDiscoveryDownloadUnavailable  = "discovery.download_unavailable"

	// Auth
	MsgUnauthorized     = "auth.unauthorized"
	MsgAPIKeyRequired   = "auth.api_key_required"
	MsgAPIKeyAlreadySet = "auth.api_key_already_set"
	MsgInvalidAPIKey    = "auth.invalid_api_key"

	MsgAuthSetupTokenInvalid = "auth.setup_token_invalid"
	MsgAuthSetupUnavailable  = "auth.setup_unavailable"
	MsgAuthRateLimited       = "auth.rate_limited"

	// Task
	MsgTaskCreated          = "task.created"
	MsgTaskEnqueued         = "task.enqueued"
	MsgTaskNotFound         = "task.not_found"
	MsgTaskStopped          = "task.stopped"
	MsgTaskLogNotConfigured = "task.log_not_configured"
	MsgTaskLogNotFound      = "task.log_not_found"
	MsgTaskLogReadFailed    = "task.log_read_failed"

	// Download
	MsgDownloadStarted = "download.started"
	MsgDownloadStopped = "download.stopped"
	MsgStatusUpdated   = "download.status_updated"

	// Config
	MsgConfigUpdated    = "config.updated"
	MsgConfigKeyUpdated = "config.key_updated" // fmt arg: %s (key name)

	// Util
	MsgURLRequired = "util.url_required"

	// Favorite
	MsgURLAlreadyExists = "favorite.url_already_exists"
	MsgFavoriteNotFound = "favorite.not_found" // fmt arg: %d

	// Event
	MsgEventStreamFailed = "event.stream_failed"

	// Core errors
	MsgUnsupportedType = "core.unsupported_type"
	MsgBinNotFound     = "core.bin_not_found"

	// DB errors
	MsgVideoNotFound      = "db.video_not_found"      // fmt arg: %d
	MsgConversionNotFound = "db.conversion_not_found" // fmt arg: %d
)
