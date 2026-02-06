请创建一个新的vue项目，并在tsconfig.json中设置

Please create a new Vue project and set it in tsconfig. json

```json
"compilerOptions": {
"experimentalDecorators": true,
"emitDecoratorMetadata": true,
}
```

同时，强烈建议使用swc来编译，请在vite中配置

Meanwhile, it is strongly recommended to use SWC for compilation. Please configure it in Vite

```ts
import swc from 'vite-plugin-swc-transform'
//在插件中开启swc
plugins: [
  swc({
    swcOptions: {
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          useDefineForClassFields: false
        }
      }
    }
  })
]
```

最后，将文件内的代码复制到src下，然后运行

Finally, copy the code from the file to src and run it