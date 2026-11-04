using MediatR;

namespace Appllication.Features.Attendance.Queries.GetAttendanceTemplate
{
    public record GetAttendanceTemplateQuery(string Format = "excel") : IRequest<AttendanceTemplateDto>;
}
