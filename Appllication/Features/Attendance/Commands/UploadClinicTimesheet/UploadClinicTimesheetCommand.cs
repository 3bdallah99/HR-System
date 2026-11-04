using Appllication.Common;
using MediatR;
using System.IO;

namespace Appllication.Features.Attendance.Commands.UploadClinicTimesheet
{
    public record UploadClinicTimesheetCommand(
        Stream FileStream,
        string FileName,
        bool AutoProvisionEmployees = true) : IRequest<ApiResponse<UploadClinicTimesheetResultDto>>;
}
