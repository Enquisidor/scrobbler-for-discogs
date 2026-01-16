// Re-export everything from the shared libs package
// This provides a cleaner import path: from '../../libs' instead of relative paths to libs folder
// Metro watches the parent folder so it can resolve this relative import
export * from '../../libs/src';
