using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IGenericRepository<TEntity>
    {
        // Queries
        Task<IReadOnlyList<TEntity>> GetAllAsync();
        Task<TEntity> GetByIdAsync(int id);
        Task<IReadOnlyList<TEntity>> FindAsync(Expression<Func<TEntity, bool>> predicate);
        Task<TEntity?> FirstOrDefultAsync(Expression<Func<TEntity, bool>> predicate);
        // Commands 
        Task AddAsync(TEntity entity);
        void Update(TEntity entity);
        void Remove(TEntity entity);

    }
}
