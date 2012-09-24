'''
	This application uses the renderEngine to render pure JSON instead
	of a page. To be used in junction with Ajax

	Author: Andrew Oberlin
	Date: July 29, 2012
'''
from renderEngine.RenderEngine import RenderEngine

class AjaxApplicationBase:
	def __init__(self):
		self.renderEngine = RenderEngine()
	
	def setJsonObject(self, obj):
		self.renderEngine.setApplicationLayout(obj)

	'''
		Should be overridden, sets the applicationLayout
		and all of the pagelet bindings
	'''
	def doProcessRender(self, request):
		self.setApplicationLayout('base.html')
		
	def render(self, request):
		self.doProcessRender(request)
		return self.renderEngine.renderJson(request)

'''
	Used for mapping to the url in urls.py
'''        	
def renderAction(request):
	return AjaxApplicationBase().render(request)
