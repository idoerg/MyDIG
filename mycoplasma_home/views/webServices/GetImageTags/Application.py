'''
	Ajax Application for getting tags related to the image
	URL: /images/getTags
	
	Author: Andrew Oberlin
	Date: July 23, 2012
'''
from renderEngine.AjaxApplicationBase import WebServiceApplicationBase
from django.views.decorators.csrf import csrf_exempt
from mycoplasma_home.views.api import ImagesAPI

class Application(WebServiceApplicationBase):
	def doProcessRender(self, request):
		errorMessage = ImagesAPI.NO_ERROR
		tagTuples = list()
		
		if request.REQUEST.has_key('tagGroupKey'):
			# the key for lookup and the image it is attached to
			tagGroupKey = request.REQUEST['tagGroupKey']
			
		else:
			errorMessage = 
		self.setJsonObject(renderObj)
'''
	Used for mapping to the url in urls.py
'''
@csrf_exempt
def renderAction(request):
	return Application().render(request)
