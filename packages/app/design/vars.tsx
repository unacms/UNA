type ThemeCssClassesType = {
  'u-btn-default-cnt': string;
  'u-btn-default-text': string;
  'u-btn-default-trans': string;
  'u-btn-primary-cnt': string;
  'u-btn-primary-text': string;
  'u-btn-primary-trans': string;
  'u-btn-danger-cnt': string;
  'u-btn-danger-text': string;
  'u-btn-danger-trans': string;
  'u-btn-text-cnt': string;
  'u-btn-text-text': string;
  'u-btn-text-trans': string;
  'u-btn-link-cnt': string;
  'u-btn-link-text': string;
  'u-btn-link-trans': string;
  'u-btn-outline-cnt': string;
  'u-btn-outline-text': string;
  'u-btn-outline-trans': string;
  [key: string]: string;
};

export const ThemeCssClasses: ThemeCssClassesType = {
  'u-btn-default-cnt': " bg-button hover:bg-button/90 active:bg-button dark:bg-button-dark dark:hover:bg-button-dark/90 dark:active:bg-button-dark ",
  'u-btn-default-text': " font-semibold text-neo-700 dark:text-neo-200",
  'u-btn-default-trans': "  duration-200 ",
  'u-btn-primary-cnt': "   font-semibold  bg-brand hover:bg-brand/90 active:bg-brand dark:bg-brand-dark dark:hover:bg-brand-dark/90 dark:active:bg-brand-dark ",
  'u-btn-primary-text': " font-semibold text-neo-50",
  'u-btn-primary-trans': "  duration-200 ",
  'u-btn-danger-cnt': "    font-semibold  bg-red-500 hover:bg-red-500/90 dark:bg-red-600 dark:hover:bg-red-600/90 ",
  'u-btn-danger-text': " font-semibold text-neo-50",
  'u-btn-danger-trans': "  duration-200  ",
  'u-btn-text-cnt': " hover:bg-button/50 active:bg-button dark:hover:bg-button-dark/50 dark:active:bg-button-dark ",
  'u-btn-text-text': " group-hover:text-neo-900  dark:group-hover:text-neo-50 font-semibold text-neo-700 dark:text-neo-200 ",
  'u-btn-text-trans': "   duration-200",
  'u-btn-link-cnt': "  ",
  'u-btn-link-text': " group-hover:text-blue-600  dark:group-hover:text-blue-500 font-medium text-blue-500 dark:text-blue-400 ",
  'u-btn-link-trans': "",
  'u-btn-outline-cnt': " duration-200 ring-1 ring-button dark:ring-button-dark ring-inset active:bg-button/90 dark:active:bg-button-dark/90 ",
  'u-btn-outline-text': " group-hover:text-neo-900  dark:group-hover:text-neo-50 font-medium text-neo-700 dark:text-neo-200 ",
  'u-btn-outline-trans': " duration-200 ",
};
