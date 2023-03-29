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
  'u-btn-default-cnt': " border border-transparent  bg-neobutton/30 hover:bg-neobutton/40 active:bg-neobutton/40 dark:bg-neobutton-dark/30 dark:hover:bg-neobutton-dark/40 dark:active:bg-neobutton-dark/50 ",
  'u-btn-default-text': " font-semibold text-neogray-800 dark:text-neogray-200",
  'u-btn-default-trans': "  duration-200 ",
  'u-btn-primary-cnt': " border border-transparent   bg-primary hover:bg-primary/90 active:bg-primary/80 dark:bg-primary-dark dark:hover:bg-primary-dark/90 dark:active:bg-primary-dark/80  ",
  'u-btn-primary-text': " font-semibold text-neogray-50",
  'u-btn-primary-trans': "  duration-200 ",
  'u-btn-danger-cnt': "  border border-transparent   bg-red-500 hover:bg-red-500/90 active:bg-red-500/80  ",
  'u-btn-danger-text': "  font-semibold text-neogray-50",
  'u-btn-danger-trans': "  duration-200  ",
  'u-btn-text-cnt': " border border-transparent  hover:bg-neobutton/30 active:bg-neobutton/40 dark:hover:bg-neobutton-dark/30 dark:active:bg-neobutton-dark/40 ",
  'u-btn-text-text': " group-hover:text-neogray-800  dark:group-hover:text-neogray-200 font-semibold text-neogray-700 dark:text-neogray-300 ",
  'u-btn-text-trans': " duration-200 ",
  'u-btn-link-cnt': " border border-transparent   ",
  'u-btn-link-text': " group-active:text-neolink/90 dark:group-active:text-neolink-dark/90 group-hover:text-neolink/80  dark:group-hover:text-neolink-dark/80 font-semibold text-neolink dark:text-neolink-dark ",
  'u-btn-link-trans': " duration-200 ",
  'u-btn-outline-cnt': "  duration-200 border border-neoborder/30 dark:border-neoborder-dark/30 hover:border-neoborder/40 dark:hover:border-neoborder-dark/40 group-active:border-neoborder/50 dark:group-active:border-neoborder-dark/50 ",
  'u-btn-outline-text': " group-hover:text-neo-900  dark:group-hover:text-neo-50 font-medium hover:text-neogray-800 dark:hover:text-neogray-200 text-neogray-700 dark:text-neogray-300 group-active:text-neogray-900 dark:group-active:text-neogray-100",
  'u-btn-outline-trans': " duration-200 ",
};
