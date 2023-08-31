package errors

import (
	"net/http"
)

func YtdlpNotFoundError() *Error{
	return &Error {
		Message: "ytdlp not found",
		StatusCode: http.StatusBadRequest,
	}
}