package dto

// UpdateConfigRequest 更新配置请求（部分更新）
type UpdateConfigRequest = map[string]any

// UpdateConfigResponse 更新配置响应
type UpdateConfigResponse struct {
	Message string `json:"message" example:"Config updated"` // 响应消息
}

// SetKeyRequest 设置单个配置项
type SetKeyRequest struct {
	Value any `json:"value"` // 配置值
}
