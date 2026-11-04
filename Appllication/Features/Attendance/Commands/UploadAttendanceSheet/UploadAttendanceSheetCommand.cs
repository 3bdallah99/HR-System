using Appllication.Common;
using MediatR;
using System.IO;

namespace Appllication.Features.Attendance.Commands.UploadAttendanceSheet
{
    public record UploadAttendanceSheetCommand(Stream FileStream, string FileName)
        : IRequest<ApiResponse<UploadAttendanceSheetResultDto>>;
}
