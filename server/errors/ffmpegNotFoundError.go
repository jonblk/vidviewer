package errors

import (
	"net/http"
)

func FfmpegNotFoundError() *Error{
	return &Error {
		Message: "ffmpeg not found",
		StatusCode: http.StatusBadRequest,
	}
}