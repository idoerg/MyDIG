'''
	Application for the Image Editor of the DOME
	URL: / or /index.html
	
	Author: Andrew Oberlin
	Date: August 5, 2012
'''
from renderEngine.ApplicationBase import ApplicationBase
from mycoplasma_home.views.pagelets.public.NavBarPagelet import NavBarPagelet
from mycoplasma_home.views.pagelets.public.HomePagelet import HomePagelet

class Application(ApplicationBase):
	def doProcessRender(self, request):
		args = {
			'title' : 'Homepage'
		}
		self.setApplicationLayout('public/base.html', args)
		self.addPageletBinding('navBar', NavBarPagelet())
		self.addPageletBinding('center-1', HomePagelet())

'''
	Used for mapping to the url in urls.py
'''        	
def renderAction(request):
	return Application().render(request)

