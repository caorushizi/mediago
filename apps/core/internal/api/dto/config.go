package dto

// UpdateConfigRequest Update config request (partial update)
type UpdateConfigRequest = map[string]any

// UpdateConfigResponse Update config response
type UpdateConfigResponse struct {
	Message string `json:"message" example:"Config updated"` // Response message
}

// SetKeyRequest Set a single config item
type SetKeyRequest struct {
	Value any `json:"value"` // Config value
}
