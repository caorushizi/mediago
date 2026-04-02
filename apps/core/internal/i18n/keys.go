package i18n

// Message key constants for i18n translations.
const (
	// Common
	MsgOK        = "common.ok"
	MsgDeleted   = "common.deleted"
	MsgImported  = "common.imported"
	MsgInvalidID = "common.invalid_id"

	// Auth
	MsgUnauthorized    = "auth.unauthorized"
	MsgAPIKeyRequired  = "auth.api_key_required"
	MsgAPIKeyAlreadySet = "auth.api_key_already_set"
	MsgInvalidAPIKey   = "auth.invalid_api_key"

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

	// Event
	MsgEventStreamFailed = "event.stream_failed"

	// Core errors
	MsgUnsupportedType = "core.unsupported_type"
	MsgBinNotFound     = "core.bin_not_found"

	// DB errors
	MsgVideoNotFound      = "db.video_not_found"      // fmt arg: %d
	MsgConversionNotFound = "db.conversion_not_found"  // fmt arg: %d
)
