'''
	Ajax Application for the Image Pagination
	URL: /image/editor/submit
	
	Author: Andrew Oberlin
	Date: July 23, 2012
'''
from renderEngine.AjaxAdminApplicationBase import AjaxAdminApplicationBase
from django.views.decorators.csrf import csrf_exempt
from mycoplasma_home.models import Picture, TagGroup, TagPoint

class Application(AjaxAdminApplicationBase):
	def doProcessRender(self, request):
		if (request.method == "POST"):
			None

		
'''
	Used for mapping to the url in urls.py
'''
@csrf_exempt			
def renderAction(request):
	return Application().render(request)
