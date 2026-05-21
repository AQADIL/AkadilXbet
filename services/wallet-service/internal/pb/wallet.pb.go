package pb

type GetBalanceRequest struct {
	UserId string
}

type GetBalanceResponse struct {
	UserId       string
	BalanceCents int64
}

type DepositRequest struct {
	UserId       string
	AmountCents  int64
}

type BalanceResponse struct {
	UserId       string
	BalanceCents int64
}

type DeductRequest struct {
	UserId      string
	AmountCents int64
}
