package errors

type Error struct {
    Message    string
    StatusCode int
}

func (e *Error) Error() string {
    return e.Message
}