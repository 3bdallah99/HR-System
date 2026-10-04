import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { PositionService } from '../../core/services/position.service';
import { TranslationService } from '../../core/services/translation.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container animate-fade-in-up" [class.rtl]="ts.isRtl()">
      <!-- Top Header & Actions -->
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="page-title fw-bold mb-1 text-dark">{{ ts.isRtl() ? 'دليل الموظفين' : 'Employee Directory' }}</h2>
          <p class="text-muted mb-0">{{ ts.isRtl() ? 'إدارة واستعراض كافة الموظفين وهياكلهم الوظيفية' : 'Manage and view all employee profiles and structures' }}</p>
        </div>

        <div class="d-flex align-items-center gap-3">
          <!-- View Mode Switcher -->
          <div class="view-mode-toggle btn-group p-1 rounded-pill bg-surface border">
            <button class="btn btn-sm rounded-pill px-3" [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')">
              <i class="fas fa-list me-1"></i> {{ ts.isRtl() ? 'جدول' : 'Table' }}
            </button>
            <button class="btn btn-sm rounded-pill px-3" [class.active]="viewMode() === 'cards'" (click)="viewMode.set('cards')">
              <i class="fas fa-th-large me-1"></i> {{ ts.isRtl() ? 'كروت' : 'Cards' }}
            </button>
          </div>

          <!-- Add Button -->
          <button class="btn btn-primary btn-premium rounded-pill px-4 shadow-sm" (click)="toggleForm()">
            <i class="fas fa-user-plus" [class.ms-2]="ts.isRtl()" [class.me-2]="!ts.isRtl()"></i>
            {{ ts.isRtl() ? 'إضافة موظف جديد' : 'Add Employee' }}
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="toolbar-card card border-0 shadow-sm p-3 mb-4 rounded-4">
        <div class="row g-3 align-items-center">
          <!-- Search Input -->
          <div class="col-md-5">
            <div class="input-group glass-input-group">
              <span class="input-group-text border-0 bg-transparent text-muted ps-3">
                <i class="fas fa-search"></i>
              </span>
              <input type="text" class="form-control border-0 bg-transparent py-2" 
                     [placeholder]="ts.isRtl() ? 'بحث بالاسم، البريد، أو الهاتف...' : 'Search by name, email, or phone...'"
                     [value]="searchTerm()" (input)="updateSearch($event)">
            </div>
          </div>

          <!-- Department Filter -->
          <div class="col-md-4">
            <select class="form-select border-0 bg-surface-select py-2 rounded-3" (change)="onFilterDepartment($event)">
              <option value="">{{ ts.isRtl() ? 'جميع الأقسام' : 'All Departments' }}</option>
              @for (dept of departments(); track dept.id) {
                <option [value]="dept.id">{{ dept.name }}</option>
              }
            </select>
          </div>

          <!-- Total Count Badge -->
          <div class="col-md-3 text-md-end text-muted small">
            <span>{{ ts.isRtl() ? 'العدد الكلي:' : 'Total:' }} <strong class="text-primary">{{ totalCount() }}</strong> {{ ts.isRtl() ? 'موظف' : 'employees' }}</span>
          </div>
        </div>
      </div>

      <!-- Slide-in Add/Edit Form Card -->
      <div class="form-card-container mb-4" [class.show]="showForm()">
        <div class="card premium-card border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="card-header border-0 bg-gradient-primary text-white p-4">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="fw-bold mb-1">
                  {{ editingId() ? (ts.isRtl() ? 'تعديل بيانات الموظف' : 'Edit Employee') : (ts.isRtl() ? 'تسجيل موظف جديد' : 'New Employee Registration') }}
                </h5>
                <p class="small text-white-50 mb-0">{{ ts.isRtl() ? 'أدخل البيانات الأساسية والوظيفية بدقة' : 'Fill in the basic and job details accurately' }}</p>
              </div>
              <button class="btn btn-sm btn-light btn-close-white rounded-circle" (click)="closeForm()">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div class="card-body p-4">
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="form-floating">
                    <input type="text" class="form-control rounded-3" id="name" formControlName="name" placeholder="الاسم بالكامل">
                    <label for="name">{{ ts.isRtl() ? 'الاسم بالكامل' : 'Full Name' }} *</label>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="form-floating">
                    <input type="email" class="form-control rounded-3" id="email" formControlName="email" placeholder="البريد الإلكتروني">
                    <label for="email">{{ ts.isRtl() ? 'البريد الإلكتروني' : 'Email' }} *</label>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="form-floating">
                    <input type="text" class="form-control rounded-3" id="phone" formControlName="phone" placeholder="رقم الهاتف">
                    <label for="phone">{{ ts.isRtl() ? 'رقم الهاتف' : 'Phone' }} *</label>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="form-floating">
                    <input type="text" class="form-control rounded-3" id="address" formControlName="address" placeholder="العنوان">
                    <label for="address">{{ ts.isRtl() ? 'العنوان والإقامة' : 'Address' }} *</label>
                  </div>
                </div>

                <div class="col-md-4">
                  <div class="form-floating">
                    <input type="date" class="form-control rounded-3" id="hireDate" formControlName="hireDate" placeholder="تاريخ التعيين">
                    <label for="hireDate">{{ ts.isRtl() ? 'تاريخ التعيين' : 'Hire Date' }} *</label>
                  </div>
                </div>

                <div class="col-md-4">
                  <div class="form-floating">
                    <select class="form-select rounded-3" id="departmentId" formControlName="departmentId" (change)="onDepartmentChange()">
                      <option [ngValue]="null" disabled selected>{{ ts.isRtl() ? '-- اختر القسم --' : '-- Select Department --' }}</option>
                      @for (dept of departments(); track dept.id) {
                        <option [value]="dept.id">{{ dept.name }}</option>
                      }
                    </select>
                    <label for="departmentId">{{ ts.isRtl() ? 'القسم' : 'Department' }} *</label>
                  </div>
                </div>

                <div class="col-md-4">
                  <div class="form-floating">
                    <select class="form-select rounded-3" id="positionId" formControlName="positionId">
                      <option [ngValue]="null" disabled selected>{{ ts.isRtl() ? '-- اختر المنصب الوظيفي --' : '-- Select Position --' }}</option>
                      @for (pos of filteredPositions(); track pos.id) {
                        <option [value]="pos.id">{{ pos.title }} ({{ pos.departmentName || pos.baseSalary + ' EGP' }})</option>
                      }
                    </select>
                    <label for="positionId">{{ ts.isRtl() ? 'المنصب الوظيفي' : 'Position' }} *</label>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end mt-4 gap-2">
                <button type="button" class="btn btn-light rounded-pill px-4" (click)="closeForm()">
                  {{ ts.isRtl() ? 'إلغاء' : 'Cancel' }}
                </button>
                <button type="submit" class="btn btn-primary btn-premium rounded-pill px-5" [disabled]="form.invalid || submitting()">
                  <i class="fas fa-spinner fa-spin me-2" *ngIf="submitting()"></i>
                  {{ ts.isRtl() ? 'حفظ البيانات' : 'Save Employee' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- VIEW 1: Modern Interactive Cards Grid -->
      @if (viewMode() === 'cards') {
        <div class="row g-4 mb-4">
          <!-- Skeleton Loading -->
          @if (loading()) {
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="col-12 col-md-6 col-xl-4">
                <div class="employee-card-modern p-4 rounded-4 shadow-sm">
                  <div class="d-flex gap-3 align-items-center mb-3">
                    <div class="skeleton-circle"></div>
                    <div class="flex-grow-1">
                      <div class="skeleton-text w-75 mb-2"></div>
                      <div class="skeleton-text w-50"></div>
                    </div>
                  </div>
                  <div class="skeleton-text w-100 mb-2"></div>
                  <div class="skeleton-text w-75"></div>
                </div>
              </div>
            }
          }

          <!-- Actual Employee Cards -->
          @if (!loading() && data().length > 0) {
            @for (item of data(); track item.id) {
              <div class="col-12 col-md-6 col-xl-4">
                <div class="employee-card-modern p-4 rounded-4 shadow-sm position-relative" (click)="viewEmployeeDetails(item)">
                  <!-- Top Row: Avatar + Info + Actions -->
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="d-flex gap-3 align-items-center">
                      <div class="avatar-gradient" [style.background]="getAvatarGradient(item.id)">
                        {{ getInitials(item.name) }}
                      </div>
                      <div>
                        <h5 class="fw-bold mb-1 text-card-title">{{ item.name }}</h5>
                        <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1">
                          {{ item.positionTitle || 'موظف' }}
                        </span>
                      </div>
                    </div>

                    <!-- Quick Action Menu -->
                    <div class="dropdown" (click)="$event.stopPropagation()">
                      <button class="btn btn-sm btn-icon btn-light rounded-circle" (click)="edit(item)" title="تعديل">
                        <i class="fas fa-pen text-primary"></i>
                      </button>
                      <button class="btn btn-sm btn-icon btn-light rounded-circle ms-1" (click)="delete(item.id)" title="حذف">
                        <i class="fas fa-trash text-danger"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Details Pill Grid -->
                  <div class="details-pill-grid mb-3">
                    <div class="pill-item">
                      <i class="fas fa-building text-primary opacity-75"></i>
                      <span>{{ item.departmentName || '-' }}</span>
                    </div>
                    <div class="pill-item">
                      <i class="fas fa-phone text-success opacity-75"></i>
                      <span dir="ltr">{{ item.phone }}</span>
                    </div>
                    <div class="pill-item">
                      <i class="fas fa-envelope text-info opacity-75"></i>
                      <span class="text-truncate" style="max-width: 140px;">{{ item.email }}</span>
                    </div>
                    <div class="pill-item">
                      <i class="fas fa-wallet text-warning opacity-75"></i>
                      <span class="fw-bold">{{ item.baseSalary | currency }}</span>
                    </div>
                  </div>

                  <!-- Footer: View Details hint -->
                  <div class="card-footer-action pt-3 border-top d-flex justify-content-between align-items-center text-muted small">
                    <span><i class="fas fa-calendar-alt me-1"></i> {{ item.hireDate | date:'mediumDate' }}</span>
                    <span class="text-primary fw-bold click-hint">
                      {{ ts.isRtl() ? 'عرض التفاصيل' : 'View Profile' }} <i class="fas" [class.fa-arrow-left]="ts.isRtl()" [class.fa-arrow-right]="!ts.isRtl()"></i>
                    </span>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      }

      <!-- VIEW 2: Ultra-Modern Floating Table -->
      @if (viewMode() === 'table') {
        <div class="card modern-table-card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div class="table-responsive">
            <table class="table modern-table align-middle mb-0">
              <thead>
                <tr>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'الموظف' : 'Employee' }}</th>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'القسم' : 'Department' }}</th>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'المنصب الوظيفي' : 'Position' }}</th>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'البريد الإلكتروني' : 'Email' }}</th>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'رقم الهاتف' : 'Phone' }}</th>
                  <th class="py-3 px-4">{{ ts.isRtl() ? 'الراتب' : 'Salary' }}</th>
                  <th class="py-3 px-4 text-end">{{ ts.isRtl() ? 'الإجراءات' : 'Actions' }}</th>
                </tr>
              </thead>
              <tbody>
                <!-- Loading Skeletons -->
                @if (loading()) {
                  @for (i of [1,2,3,4,5]; track i) {
                    <tr>
                      <td class="px-4 py-3"><div class="skeleton-text w-75"></div></td>
                      <td class="px-4 py-3"><div class="skeleton-text w-50"></div></td>
                      <td class="px-4 py-3"><div class="skeleton-text w-50"></div></td>
                      <td class="px-4 py-3"><div class="skeleton-text w-75"></div></td>
                      <td class="px-4 py-3"><div class="skeleton-text w-50"></div></td>
                      <td class="px-4 py-3"><div class="skeleton-text w-25"></div></td>
                      <td class="px-4 py-3 text-end"><div class="skeleton-text w-50 d-inline-block"></div></td>
                    </tr>
                  }
                }

                <!-- Rows -->
                @if (!loading() && data().length > 0) {
                  @for (item of data(); track item.id) {
                    <tr class="modern-row" (click)="viewEmployeeDetails(item)">
                      <!-- Name & Avatar -->
                      <td class="px-4 py-3">
                        <div class="d-flex align-items-center">
                          <div class="avatar-gradient me-3" [class.ms-3]="ts.isRtl()" [class.me-3]="!ts.isRtl()" [style.background]="getAvatarGradient(item.id)">
                            {{ getInitials(item.name) }}
                          </div>
                          <div>
                            <div class="fw-bold text-card-title hover-underline">{{ item.name }}</div>
                            <small class="text-muted d-block">{{ item.address || '-' }}</small>
                          </div>
                        </div>
                      </td>

                      <!-- Department -->
                      <td class="px-4 py-3">
                        <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                          <i class="fas fa-building me-1 opacity-75"></i> {{ item.departmentName || '-' }}
                        </span>
                      </td>

                      <!-- Position -->
                      <td class="px-4 py-3">
                        <span class="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill">
                          <i class="fas fa-briefcase me-1 opacity-75"></i> {{ item.positionTitle || '-' }}
                        </span>
                      </td>

                      <!-- Email -->
                      <td class="px-4 py-3 text-muted">
                        <span class="d-flex align-items-center">
                          <i class="fas fa-envelope text-muted me-2 opacity-50"></i> {{ item.email }}
                        </span>
                      </td>

                      <!-- Phone -->
                      <td class="px-4 py-3 text-muted" dir="ltr">
                        {{ item.phone }}
                      </td>

                      <!-- Base Salary -->
                      <td class="px-4 py-3 fw-bold text-success">
                        {{ item.baseSalary | currency }}
                      </td>

                      <!-- Actions -->
                      <td class="px-4 py-3 text-end" (click)="$event.stopPropagation()">
                        <button class="btn btn-sm btn-icon btn-light me-1 rounded-circle shadow-sm" (click)="edit(item)" title="تعديل">
                          <i class="fas fa-pen text-primary"></i>
                        </button>
                        <button class="btn btn-sm btn-icon btn-light rounded-circle shadow-sm" (click)="delete(item.id)" title="حذف">
                          <i class="fas fa-trash text-danger"></i>
                        </button>
                      </td>
                    </tr>
                  }
                }

                <!-- Empty State -->
                @if (!loading() && data().length === 0) {
                  <tr>
                    <td colspan="7" class="text-center py-5">
                      <div class="empty-state py-4">
                        <div class="empty-icon-wrapper mx-auto mb-3">
                          <i class="fas fa-users text-muted fa-3x"></i>
                        </div>
                        <h5 class="fw-bold">{{ ts.isRtl() ? 'لم يتم العثور على أي موظف' : 'No Employees Found' }}</h5>
                        <p class="text-muted">{{ ts.isRtl() ? 'حاول تعديل شروط البحث أو إضافة موظف جديد' : 'Try adjusting your search criteria or add a new employee' }}</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Pagination -->
      <div class="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row justify-content-between align-items-center bg-surface" *ngIf="!loading() && totalCount() > 0">
        <span class="text-muted small">
          {{ ts.isRtl() ? 'عرض موظفين صفحة' : 'Showing page' }} <strong>{{ page() }}</strong> {{ ts.isRtl() ? 'من إجمالي' : 'of' }} <strong>{{ totalCount() }}</strong>
        </span>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary rounded-pill px-3" [disabled]="page() === 1" (click)="prevPage()">
            <i class="fas fa-chevron-right" *ngIf="ts.isRtl()"></i>
            <i class="fas fa-chevron-left" *ngIf="!ts.isRtl()"></i>
            {{ ts.isRtl() ? ' السابق' : ' Prev' }}
          </button>
          <span class="badge bg-primary px-3 py-2 rounded-pill d-flex align-items-center">{{ page() }}</span>
          <button class="btn btn-sm btn-outline-secondary rounded-pill px-3" (click)="nextPage()">
            {{ ts.isRtl() ? 'التالي ' : 'Next ' }}
            <i class="fas fa-chevron-left" *ngIf="ts.isRtl()"></i>
            <i class="fas fa-chevron-right" *ngIf="!ts.isRtl()"></i>
          </button>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- SLIDING EMPLOYEE PROFILE DETAILS MODAL / CARD OVERLAY -->
      <!-- ======================================================== -->
      @if (selectedEmployee()) {
        <div class="modal-backdrop-custom" (click)="closeEmployeeDetails()">
          <div class="employee-detail-modal shadow-2xl rounded-4 overflow-hidden" (click)="$event.stopPropagation()">
            <!-- Banner Header -->
            <div class="modal-profile-banner p-4 text-white position-relative" [style.background]="getAvatarGradient(selectedEmployee().id)">
              <button class="btn-close-modal rounded-circle" (click)="closeEmployeeDetails()">
                <i class="fas fa-times"></i>
              </button>

              <div class="d-flex align-items-center gap-4 mt-3">
                <div class="large-avatar-circle shadow-lg">
                  {{ getInitials(selectedEmployee().name) }}
                  <span class="status-indicator online"></span>
                </div>
                <div>
                  <h3 class="fw-bold mb-1">{{ selectedEmployee().name }}</h3>
                  <div class="d-flex gap-2 flex-wrap">
                    <span class="badge bg-white text-dark rounded-pill px-3 py-1 shadow-sm">
                      <i class="fas fa-briefcase text-primary me-1"></i> {{ selectedEmployee().positionTitle || 'موظف' }}
                    </span>
                    <span class="badge bg-black bg-opacity-25 text-white rounded-pill px-3 py-1">
                      <i class="fas fa-building me-1"></i> {{ selectedEmployee().departmentName || 'القسم' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Profile Info Body -->
            <div class="modal-profile-body p-4">
              <h6 class="text-uppercase text-muted fw-bold mb-3 small letter-spacing-1">
                {{ ts.isRtl() ? 'المعلومات الشخصية والوظيفية' : 'Employee Details' }}
              </h6>

              <div class="row g-3 mb-4">
                <!-- Email -->
                <div class="col-md-6">
                  <div class="info-box p-3 rounded-3 bg-surface border">
                    <div class="d-flex align-items-center gap-3">
                      <div class="info-icon text-primary bg-primary bg-opacity-10 rounded-circle">
                        <i class="fas fa-envelope"></i>
                      </div>
                      <div>
                        <small class="text-muted d-block">{{ ts.isRtl() ? 'البريد الإلكتروني' : 'Email Address' }}</small>
                        <span class="fw-bold">{{ selectedEmployee().email }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Phone -->
                <div class="col-md-6">
                  <div class="info-box p-3 rounded-3 bg-surface border">
                    <div class="d-flex align-items-center gap-3">
                      <div class="info-icon text-success bg-success bg-opacity-10 rounded-circle">
                        <i class="fas fa-phone"></i>
                      </div>
                      <div>
                        <small class="text-muted d-block">{{ ts.isRtl() ? 'رقم الهاتف' : 'Phone Number' }}</small>
                        <span class="fw-bold" dir="ltr">{{ selectedEmployee().phone }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Address -->
                <div class="col-md-6">
                  <div class="info-box p-3 rounded-3 bg-surface border">
                    <div class="d-flex align-items-center gap-3">
                      <div class="info-icon text-danger bg-danger bg-opacity-10 rounded-circle">
                        <i class="fas fa-map-marker-alt"></i>
                      </div>
                      <div>
                        <small class="text-muted d-block">{{ ts.isRtl() ? 'محل الإقامة' : 'Address' }}</small>
                        <span class="fw-bold">{{ selectedEmployee().address || (ts.isRtl() ? 'غير محدد' : 'Not specified') }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Hire Date -->
                <div class="col-md-6">
                  <div class="info-box p-3 rounded-3 bg-surface border">
                    <div class="d-flex align-items-center gap-3">
                      <div class="info-icon text-warning bg-warning bg-opacity-10 rounded-circle">
                        <i class="fas fa-calendar-check"></i>
                      </div>
                      <div>
                        <small class="text-muted d-block">{{ ts.isRtl() ? 'تاريخ التعيين' : 'Hire Date' }}</small>
                        <span class="fw-bold">{{ selectedEmployee().hireDate | date:'fullDate' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Base Salary -->
                <div class="col-md-6">
                  <div class="info-box p-3 rounded-3 bg-surface border">
                    <div class="d-flex align-items-center gap-3">
                      <div class="info-icon text-success bg-success bg-opacity-10 rounded-circle">
                        <i class="fas fa-money-bill-wave"></i>
                      </div>
                      <div>
                        <small class="text-muted d-block">{{ ts.isRtl() ? 'الراتب الأساسي' : 'Base Salary' }}</small>
                        <span class="fw-bold text-success fs-5">{{ selectedEmployee().baseSalary | currency }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Department / Position -->
                <div class="col-md-6">
                  <div class="info-box p-3 rounded-3 bg-surface border">
                    <div class="d-flex align-items-center gap-3">
                      <div class="info-icon text-info bg-info bg-opacity-10 rounded-circle">
                        <i class="fas fa-id-card"></i>
                      </div>
                      <div>
                        <small class="text-muted d-block">{{ ts.isRtl() ? 'الرقم التعريفي (ID)' : 'Employee ID' }}</small>
                        <span class="fw-bold">#EMP-{{ selectedEmployee().id }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button class="btn btn-outline-danger rounded-pill px-4" (click)="delete(selectedEmployee().id); closeEmployeeDetails()">
                  <i class="fas fa-trash me-1"></i> {{ ts.isRtl() ? 'حذف الموظف' : 'Delete' }}
                </button>
                <button class="btn btn-primary btn-premium rounded-pill px-4" (click)="edit(selectedEmployee()); closeEmployeeDetails()">
                  <i class="fas fa-pen me-1"></i> {{ ts.isRtl() ? 'تعديل البيانات' : 'Edit Profile' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem 0;
      background-color: transparent;
      font-family: inherit;
    }
    .rtl { direction: rtl; }
    .rtl .text-end { text-align: left !important; }

    /* Animated gradient button */
    .btn-premium {
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      border: none;
      transition: all 0.25s ease;
      color: white;
    }
    .btn-premium:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px -4px rgba(59, 130, 246, 0.5);
      color: white;
    }

    /* View Switcher */
    .view-mode-toggle {
      background: var(--bg-surface-solid, #ffffff);
    }
    .view-mode-toggle .btn {
      border: none;
      color: var(--text-secondary, #64748b);
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .view-mode-toggle .btn.active {
      background: #3b82f6;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
    }

    /* Toolbar Card */
    .toolbar-card {
      background: var(--bg-surface-solid, #ffffff);
      border: 1px solid var(--border-color, rgba(226, 232, 240, 0.8)) !important;
    }
    .glass-input-group {
      background: rgba(0, 0, 0, 0.03);
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .bg-surface-select {
      background-color: rgba(0, 0, 0, 0.03);
      border: 1px solid var(--border-color, #e2e8f0) !important;
      color: var(--text-primary);
    }

    /* Employee Modern Cards */
    .employee-card-modern {
      background: var(--bg-surface-solid, #ffffff);
      border: 1px solid var(--border-color, rgba(226, 232, 240, 0.8));
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .employee-card-modern:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 28px -6px rgba(0, 0, 0, 0.15) !important;
      border-color: #3b82f6 !important;
    }
    .text-card-title {
      color: var(--text-primary, #0f172a);
    }
    .employee-card-modern:hover .click-hint {
      transform: translateX(-4px);
    }

    .avatar-gradient {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      color: white;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
      flex-shrink: 0;
    }

    .details-pill-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    .pill-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
      font-size: 0.8rem;
      color: var(--text-secondary, #64748b);
    }

    /* Modern Table Rows */
    .modern-table-card {
      background: var(--bg-surface-solid, #ffffff);
      border: 1px solid var(--border-color, rgba(226, 232, 240, 0.8)) !important;
    }
    .modern-table thead th {
      border-bottom: 2px solid var(--border-color, #e2e8f0);
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary, #64748b);
      background: transparent;
    }
    .modern-row {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .modern-row:hover {
      background-color: rgba(59, 130, 246, 0.04) !important;
    }
    .modern-row:hover .hover-underline {
      color: #3b82f6 !important;
    }

    /* Skeleton loaders */
    .skeleton-circle {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    .skeleton-text {
      height: 12px;
      background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Modal / Profile Card Overlay */
    .modal-backdrop-custom {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.25s ease-out;
    }
    .employee-detail-modal {
      width: 100%;
      max-width: 650px;
      background: var(--bg-surface-solid, #ffffff);
      border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
      animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes scaleUp {
      from { transform: scale(0.95) translateY(15px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
    .btn-close-modal {
      position: absolute;
      top: 1rem;
      inset-inline-end: 1rem;
      width: 36px;
      height: 36px;
      background: rgba(0, 0, 0, 0.25);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .btn-close-modal:hover {
      background: rgba(0, 0, 0, 0.45);
      transform: rotate(90deg);
    }
    .large-avatar-circle {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      color: white;
      font-size: 1.75rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(255, 255, 255, 0.5);
      position: relative;
    }
    .status-indicator {
      position: absolute;
      bottom: -2px;
      inset-inline-end: -2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
    }
    .status-indicator.online {
      background: #10b981;
    }

    .info-icon {
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .form-card-container {
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    }
    .form-card-container.show {
      max-height: 1000px;
      opacity: 1;
      overflow: visible;
    }
  `]
})
export class EmployeeListComponent implements OnInit {
  ts = inject(TranslationService);
  toast = inject(ToastService);
  svc = inject(EmployeeService);
  deptSvc = inject(DepartmentService);
  posSvc = inject(PositionService);
  fb = inject(FormBuilder);

  data = signal<any[]>([]);
  departments = signal<any[]>([]);
  positions = signal<any[]>([]);
  totalCount = signal(0);
  loading = signal(true);
  submitting = signal(false);
  searchTerm = signal('');
  selectedDepartmentId = signal<number | null>(null);
  showForm = signal(false);
  editingId = signal<number | null>(null);

  // Modern UI states
  viewMode = signal<'cards' | 'table'>('table');
  selectedEmployee = signal<any | null>(null);

  page = signal(1);
  pageSize = signal(12);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    hireDate: ['', Validators.required],
    departmentId: [null, Validators.required],
    positionId: [null, Validators.required]
  });

  filteredPositions = computed(() => {
    const selectedDeptId = this.form.get('departmentId')?.value;
    if (!selectedDeptId) return this.positions();
    return this.positions().filter(p => !p.departmentId || p.departmentId === Number(selectedDeptId));
  });

  gradients = [
    'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    'linear-gradient(135deg, #dc2626 0%, #f43f5e 100%)',
    'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)'
  ];

  getAvatarGradient(id: number): string {
    return this.gradients[(id || 0) % this.gradients.length];
  }

  ngOnInit() {
    this.loadData();
    this.loadDropdowns();
  }

  loadDropdowns() {
    this.deptSvc.getAll(1, 100).subscribe({
      next: (res: any) => {
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        this.departments.set(items);
      }
    });

    this.posSvc.getAll(1, 100).subscribe({
      next: (res: any) => {
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        this.positions.set(items);
      }
    });
  }

  onDepartmentChange() {
    const currentPosId = this.form.get('positionId')?.value;
    const available = this.filteredPositions();
    if (currentPosId && !available.some(p => p.id === currentPosId)) {
      this.form.get('positionId')?.setValue(null);
    }
  }

  onFilterDepartment(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedDepartmentId.set(val ? Number(val) : null);
    this.page.set(1);
    this.loadData();
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  loadData() {
    this.loading.set(true);
    const deptId = this.selectedDepartmentId() || undefined;
    this.svc.getAll(this.page(), this.pageSize(), undefined, undefined, deptId).subscribe({
      next: (res: any) => {
        let items = (res.data?.items || (Array.isArray(res.data) ? res.data : (res.data?.items || res.items || [])));
        const term = this.searchTerm().toLowerCase();
        if (term) {
          items = items.filter((emp: any) => 
            emp.name?.toLowerCase().includes(term) ||
            emp.email?.toLowerCase().includes(term) ||
            emp.phone?.includes(term)
          );
        }
        this.data.set(items);
        this.totalCount.set((res.data?.totalCount || res.totalCount) || items.length);
        this.loading.set(false);
      },
      error: () => {
        this.toast.show(this.ts.isRtl() ? 'فشل تحميل بيانات الموظفين' : 'Failed to load employees', 'error');
        this.loading.set(false);
      }
    });
  }

  updateSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    this.loadData();
  }

  viewEmployeeDetails(item: any) {
    this.selectedEmployee.set(item);
  }

  closeEmployeeDetails() {
    this.selectedEmployee.set(null);
  }

  toggleForm() {
    if (this.showForm()) {
      this.closeForm();
    } else {
      this.showForm.set(true);
    }
  }

  closeForm() {
    this.showForm.set(false);
    this.form.reset();
    this.editingId.set(null);
  }

  edit(item: any) {
    this.editingId.set(item.id);
    this.form.patchValue({
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      hireDate: item.hireDate ? item.hireDate.substring(0, 10) : '',
      departmentId: item.departmentId,
      positionId: item.positionId
    });
    this.showForm.set(true);
  }

  delete(id: number) {
    const msg = this.ts.isRtl() ? 'هل أنت متأكد من حذف هذا الموظف نهائياً؟' : 'Are you sure you want to delete this employee?';
    if (confirm(msg)) {
      this.svc.delete(id).subscribe({
        next: () => {
          this.toast.show(this.ts.isRtl() ? 'تم حذف الموظف بنجاح' : 'Employee deleted successfully', 'success');
          this.loadData();
        },
        error: () => {
          this.toast.show(this.ts.isRtl() ? 'فشل حذف الموظف' : 'Failed to delete employee', 'error');
        }
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const id = this.editingId();
    const payload = {
      ...this.form.value,
      departmentId: Number(this.form.value.departmentId),
      positionId: Number(this.form.value.positionId)
    };

    const req = id ? this.svc.update(id, payload) : this.svc.create(payload);

    (req as any).subscribe({
      next: () => {
        this.toast.show(this.ts.isRtl() ? 'تم حفظ بيانات الموظف بنجاح' : 'Employee saved successfully', 'success');
        this.submitting.set(false);
        this.closeForm();
        this.loadData();
      },
      error: (err: any) => {
        this.toast.show(err?.error?.message || (this.ts.isRtl() ? 'فشل حفظ الموظف' : 'Failed to save employee'), 'error');
        this.submitting.set(false);
      }
    });
  }

  nextPage() {
    this.page.set(this.page() + 1);
    this.loadData();
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.loadData();
    }
  }
}
