import { createStarry } from '@starry/core'
import { VuePlugin } from '@starry/vue'
import { HomePageConrtoller } from './controllers/homePageController'
import { SongController } from './controllers/songController'
import { PlaylistController } from './controllers/playListController'
import { PlaylistComponent } from './components/testComponent'
import { PlayerComponent } from './components/testComponent'

const app = createStarry()
app.use(VuePlugin, {})
/**
 * 所有的 Controller 和 Component 都在这里排队登记
 */
export function bootstrapDI() {
  app.bindController(PlaylistController)
  app.bindController(SongController)
  app.bindController(HomePageConrtoller)
  app.bindComponent(PlaylistComponent)
  app.bindComponent(PlayerComponent)
}
