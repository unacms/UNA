import Reactotron, { networking, trackGlobalErrors, openInEditor  } from "reactotron-react-native";


Reactotron
  .configure({ name: 'NEO' }) // настраиваем подключение
  .use(networking())
  .use(openInEditor()) 
  .use(trackGlobalErrors()) // отслеживание глобальных ошибок
  .useReactNative() // добавляем плагины React Native
  .connect(); // устанавливаем соединение

// Очищаем лог при каждом запуске
if (__DEV__) {
  Reactotron.clear();
}

// Делаем Reactotron доступным через console.tron
console.tron = Reactotron;


/*
import Reactotron from "reactotron-react-native"
const bench = Reactotron.benchmark("slow function benchmark")
  
    // Code that does thing A
    bench.step("Thing A")
  
    // Code that does thing B
    bench.step("Thing B")
  
    // Code that does thing C
    bench.stop("Thing C")*/
