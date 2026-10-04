using Appllication.Common;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Payroll.Queries.GetPayrollByMonth
{
    public class GetPayrollByMonthQueryHandler
        : IRequestHandler<GetPayrollByMonthQuery, ApiResponse<GetPayrollByMonthDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetPayrollByMonthQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<GetPayrollByMonthDto>> Handle(
            GetPayrollByMonthQuery request, CancellationToken cancellationToken)
        {
            var query = _unitOfWork
                .GetRepository<Domain.Entities.Payroll>()
                .GetQueryable()
                .AsNoTracking()
                .Where(p => p.Month == request.Month && p.Year == request.Year);

            if (request.DepartmentId.HasValue)
                query = query.Where(p => p.Employee.DepartmentId == request.DepartmentId.Value);

            var payslips = await query
                .OrderBy(p => p.Employee.Name)
                .Select(p => new PayrollSummaryDto(
                    p.Id,
                    p.EmployeeId,
                    p.Employee.Name,
                    p.Employee.Department.Name,
                    p.Employee.Position.Title,
                    p.BasicSalary,
                    p.GrossPay,
                    p.OvertimePay,
                    p.AbsenceDeduction,
                    p.TardinessDeduction,
                    p.TotalDeductions,
                    p.NetPay,
                    p.DaysPresent,
                    p.DaysAbsent,
                    p.PaymentDate))
                .ToListAsync(cancellationToken);

            var result = new GetPayrollByMonthDto(
                request.Month,
                request.Year,
                payslips.Sum(p => p.BasicSalary),
                payslips.Sum(p => p.GrossPay),
                payslips.Sum(p => p.OvertimePay),
                payslips.Sum(p => p.TotalDeductions),
                payslips.Sum(p => p.NetPay),
                payslips.Count,
                payslips);

            return ApiResponse<GetPayrollByMonthDto>.Ok(
                result, $"Payroll for {request.Month}/{request.Year} retrieved successfully");
        }
    }
}
