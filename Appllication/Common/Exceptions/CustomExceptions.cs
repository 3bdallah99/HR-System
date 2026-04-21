using System;

namespace Appllication.Common.Exceptions
{
 
    /// Thrown when a requested entity is not found.
    /// Results in HTTP 404 (Not Found).
  
    public class NotFoundException : Exception
    {
        public NotFoundException(string entityName, object key)
            : base($"{entityName} with ID '{key}' was not found.") { }
        
        public NotFoundException(string message) : base(message) { }
    }

  
    /// Thrown when a business rule is violated (e.g., duplicate email).
    /// Results in HTTP 409 (Conflict).

    public class ConflictException : Exception
    {
        public ConflictException(string message) : base(message) { }
    }


    /// Thrown when the user doesn't have permission.
    /// Results in HTTP 403 (Forbidden).
 
    public class ForbiddenException : Exception
    {
        public ForbiddenException(string message = "You do not have permission to perform this action.")
            : base(message) { }
    }


    /// Thrown for general bad request scenarios (e.g., bad inputs).
    /// Results in HTTP 400 (Bad Request).
    public class BadRequestException : Exception
    {
        public BadRequestException(string message) : base(message) { }
    }
}
