export interface Image {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  fullName?: string;
  avatar?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Credentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Common TypeScript types and interfaces
 * Tập trung các kiểu dữ liệu dùng chung trong ứng dụng
 */

export interface Post {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  thumbnail?: string;
  image?: string;
  images?: Image[];
  category: Category | string;
  tags?: Tag[];
  isPublished: boolean;
  isFeatured?: boolean;
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  readingTime?: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

// Basic types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Generic response type for API calls
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string | number;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Paginated response type
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search parameters
export interface SearchParams extends PaginationParams {
  query?: string;
  [key: string]: any;
}

// Generic option type for select/dropdown components
export interface OptionType {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// Generic key-value pair
export interface KeyValuePair<K = string, V = any> {
  key: K;
  value: V;
}

// Generic dictionary type
export type Dictionary<T = any> = Record<string, T>;

// Generic function type
export type Fn = (...args: any[]) => any;

// Generic component props with children
export type PropsWithChildren<P = unknown> = P & {
  children?: React.ReactNode;
};

// Generic component with class name
export type ComponentWithClassName<P = unknown> = P & {
  className?: string;
};

// Generic component with style
export type ComponentWithStyle<P = unknown> = P & {
  style?: React.CSSProperties;
};

// Generic component with ref
export type ComponentWithRef<P = unknown, R = any> = P & {
  ref?: React.Ref<R>;
};

// Generic component with all common props
export type ComponentProps<P = unknown, R = any> = PropsWithChildren<
  ComponentWithClassName<ComponentWithStyle<ComponentWithRef<P, R>>>
>;

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Form related types
export type FormErrors = Record<string, string | string[]>;
export type FormTouched = Record<string, boolean>;
export type FormValues = Record<string, any>;

// API request config
export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: 'json' | 'blob' | 'arraybuffer' | 'document' | 'text' | 'stream';
}

// API error response
export interface ApiError extends Error {
  response?: {
    status: number;
    data: any;
    headers: Record<string, string>;
  };
  config: ApiRequestConfig;
  code?: string;
  isAxiosError: boolean;
  toJSON: () => object;
}

// User roles
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  USER = 'user',
  GUEST = 'guest',
}

// User status
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

// Post status
export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  TRASHED = 'trashed',
}

// Comment status
export enum CommentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SPAM = 'spam',
}

// Media type
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  ARCHIVE = 'archive',
  OTHER = 'other',
}

// Notification type
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

// Notification
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Menu item type
export interface MenuItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  roles?: UserRole[];
  divider?: boolean;
  disabled?: boolean;
  external?: boolean;
  target?: '_blank' | '_self' | '_parent' | '_top';
}

// Breadcrumb item
export interface BreadcrumbItem {
  title: string;
  path?: string;
  active?: boolean;
}

// Table column definition
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  render?: (text: any, record: T, index: number) => React.ReactNode;
  sorter?: (a: T, b: T) => number;
  defaultSortOrder?: 'ascend' | 'descend';
  filterDropdown?: React.ReactNode;
  onFilter?: (value: any, record: T) => boolean;
  filterMultiple?: boolean;
  filters?: Array<{ text: string; value: any }>;
  onFilterDropdownVisibleChange?: (visible: boolean) => void;
  filterIcon?: (filtered: boolean) => React.ReactNode;
  filterMode?: 'menu' | 'tree';
  filterSearch?: boolean;
  children?: TableColumn<T>[];
}

// Table pagination
export interface TablePagination {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  onChange?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
  pageSizeOptions?: string[];
  position?: Array<'topLeft' | 'topCenter' | 'topRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight'>;
}

// Table row selection
export interface TableRowSelection<T> {
  selectedRowKeys: React.Key[];
  onChange: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
  getCheckboxProps?: (record: T) => {
    disabled?: boolean;
    checkboxName?: string;
  };
  type?: 'checkbox' | 'radio';
  fixed?: boolean;
  hideSelectAll?: boolean;
  selections?: Array<{
    key: string;
    text: string;
    onSelect: (changeableRowKeys: React.Key[]) => void;
  }>;
  preserveSelectedRowKeys?: boolean;
}

// Form layout
export type FormLayout = 'horizontal' | 'vertical' | 'inline';

// Form item layout
// Used for Ant Design Form layout
// See: https://ant.design/components/form/#Form.Item
// - labelCol: label layout, like `{ span: 4 }`
// - wrapperCol: wrapper layout, like `{ span: 14 }`
// - colon: whether to show colon after label
// - labelAlign: text align of label
// - wrapperStyle: style of wrapper
// - wrapperClass: className of wrapper
// - help: help text
// - extra: extra text
// - validateStatus: validate status of form item
// - hasFeedback: whether to show feedback icon
// - required: whether to show required mark
// - style: style of form item
// - className: className of form item
export interface FormItemLayoutProps {
  labelCol?: { span: number; offset?: number };
  wrapperCol?: { span: number; offset?: number };
  colon?: boolean;
  labelAlign?: 'left' | 'right';
  wrapperStyle?: React.CSSProperties;
  wrapperClass?: string;
  help?: React.ReactNode;
  extra?: React.ReactNode;
  validateStatus?: 'success' | 'warning' | 'error' | 'validating';
  hasFeedback?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

// Form field definition
export interface FormField<T = any> {
  // Field identification
  name: string | number | (string | number)[];
  fieldKey?: string | number | (string | number)[];
  
  // Field display
  label?: React.ReactNode;
  tooltip?: string | { title: React.ReactNode; icon?: React.ReactNode };
  placeholder?: string;
  
  // Field type and options
  type?:
    | 'text'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'switch'
    | 'date'
    | 'time'
    | 'datetime'
    | 'daterange'
    | 'upload'
    | 'editor'
    | 'hidden';
  options?: Array<{ label: string; value: any; disabled?: boolean }>;
  
  // Field state
  defaultValue?: any;
  initialValue?: any;
  disabled?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  required?: boolean;
  
  // Validation
  rules?: any[];
  validateTrigger?: string | string[];
  validateFirst?: boolean;
  validateDebounce?: number;
  validateStatus?: 'success' | 'warning' | 'error' | 'validating';
  hasFeedback?: boolean;
  help?: React.ReactNode;
  
  // Styling
  style?: React.CSSProperties;
  className?: string;
  wrapperStyle?: React.CSSProperties;
  wrapperClassName?: string;
  noStyle?: boolean;
  
  // Layout
  labelCol?: { span: number; offset?: number };
  wrapperCol?: { span: number; offset?: number };
  labelAlign?: 'left' | 'right';
  colon?: boolean;
  
  // Value handling
  valuePropName?: string;
  getValueProps?: (value: any) => any;
  getValueFromEvent?: (...args: any[]) => any;
  normalize?: (value: any, prevValue: any, allValues: T) => any;
  format?: (value: any, name: string) => any;
  
  // Dependencies and updates
  dependencies?: string[] | ((values: any[], form: any) => void);
  shouldUpdate?: boolean | ((prevValues: T, curValues: T) => boolean);
  trigger?: string;
  
  // Event handlers
  onValueChange?: (value: any, form: any) => void;
  onDependencyChange?: (values: any[], form: any) => void;
  
  // Form events (these should be on the form, not the field)
  // Removed duplicate form event handlers
  
  // Other
  inputProps?: Record<string, any>;
  render?: (form: any) => React.ReactNode;
  extra?: React.ReactNode;
  htmlFor?: string;
  id?: string;
  isListField?: boolean;
  messageVariables?: Record<string, string>;
  preserve?: boolean;
}

// Form schema
export type FormSchema<T = any> = FormField<T>[];

// API response with pagination
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// Generic list response with pagination
export interface ListResponse<T> {
  results: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
