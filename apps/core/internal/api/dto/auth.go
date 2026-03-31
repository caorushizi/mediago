package dto

// SetupAuthRequest is the request body for auth setup.
type SetupAuthRequest struct {
	ApiKey string `json:"apiKey" binding:"required"`
}

// SigninRequest is the request body for sign-in.
type SigninRequest struct {
	ApiKey string `json:"apiKey" binding:"required"`
}

// AuthStatusResponse is the response for auth status check.
type AuthStatusResponse struct {
	Setuped bool `json:"setuped"`
}
