// CG 系列配置的类型声明
declare module '*.yaml' {
  const content: Record<string, number>;
  export default content;
}
