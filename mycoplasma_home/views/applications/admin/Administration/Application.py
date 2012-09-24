'''
	Application for the Logout Handler of the DOME
	URL: /logout_handler
	
	Author: Andrew Oberlin
	Date: August 14, 2012
'''
from renderEngine.AdminApplicationBase import AdminApplicationBase
from mycoplasma_home.views.pagelets.admin.NavBarPagelet import NavBarPagelet

class Application(AdminApplicationBase):
	def doProcessRender(self, request):
		args = {
			'title' : 'Administration'
		}
		
		self.setApplicationLayout('admin/base.html', args)
		self.addPageletBinding('navBar', NavBarPagelet())

'''
	Used for mapping to the url in urls.py
'''      	
def renderAction(request):
	return Application().render(request)

