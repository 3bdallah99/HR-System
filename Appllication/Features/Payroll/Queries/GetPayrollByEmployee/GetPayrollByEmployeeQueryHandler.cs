using Appllication.Common;
using Appllication.Common.Exceptions;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Appllication.Features.Payroll.Queries.GetPayrollByEmployee
{
    public class GetPayrollByEmployeeQueryHandler
        : IRequestHandler<GetPayrollByEmployeeQuery,
            ApiResponse<PaginatedResult<GetPayrollByEmployeeDto>>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetPayrollByEmployeeQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse<PaginatedResult<GetPayrollByEmployeeDto>>> Handle(
            GetPayrollByEmployeeQuery request, CancellationToken cancellationToken)
        {
            var empExists = await _unitOfWork
                .GetRepository<Domain.Entities.Employee>()
                .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

            if (!empExists)
                throw new NotFoundException(nameof(Domain.Entities.Employee), request.EmployeeId);

            var query = _unitOfWork
                .GetRepository<Domain.Entities.Payroll>()
                .GetQueryable()
                .AsNoTracking()
                .Where(p => p.EmployeeId == request.EmployeeId);

            if (request.Year.HasValue)
                query = query.Where(p => p.Year == request.Year.Value);

            var totalCount = await query.CountAsync(cancellationToken);

            var payrolls = await query
                .OrderByDescending(p => p.Year)
                .ThenByDescending(p => p.Month)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(p => new GetPayrollByEmployeeDto(
                    p.Id,
                    p.Month,
                    p.Year,
                    p.PaymentDate,
                    p.BasicSalary,
                    p.HousingAllowance,
                    p.TransportationAllowance,
                    p.MealAllowance,
                    p.OtherAllowances,
                    p.OvertimePay,
                    p.GrossPay,
                    p.AbsenceDeduction,
                    p.TardinessDeductionMinutes,
                    p.TardinessDeduction,
                    p.SocialInsurance,
                    p.TaxAmount,
                    p.OtherDeductions,
                    p.TotalDeductions,
                    p.NetPay,
                    p.WorkingDaysInMonth,
                    p.DaysPresent,
                    p.DaysAbsent,
                    p.ApprovedLeaveDays,
                    p.TotalLateMinutes))
                .ToListAsync(cancellationToken);

            var result = new PaginatedResult<GetPayrollByEmployeeDto>
            {
                Items = payrolls,
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };

            return ApiResponse<PaginatedResult<GetPayrollByEmployeeDto>>.Ok(
                result, "Payroll records retrieved successfully");
        }
    }
}
