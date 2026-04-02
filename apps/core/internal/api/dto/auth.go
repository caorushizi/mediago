package dto

// SetupAuthRequest is the request body for initial auth setup.
type SetupAuthRequest struct {
	Password string `json:"password" binding:"required,min=6"`
}

// SigninRequest is the request body for sign-in.
type SigninRequest struct {
	Password string `json:"password" binding:"required"`
}

// AuthStatusResponse is the response for auth status check.
type AuthStatusResponse struct {
	Setuped bool `json:"setuped"`
}
