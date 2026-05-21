package pb

type RegisterRequest struct {
	Email    string
	Password string
}

type RegisterResponse struct {
	UserId string
	Token  string
}

type LoginRequest struct {
	Email    string
	Password string
}

type LoginResponse struct {
	UserId string
	Token  string
}

type GetUserProfileRequest struct {
	UserId string
}

type GetUserProfileResponse struct {
	UserId    string
	Email     string
	CreatedAt int64
}
