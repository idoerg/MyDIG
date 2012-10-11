'''
	Ajax Application for getting tags related to the image
	URL: /image_change
	
	Author: Andrew Oberlin
	Date: July 23, 2012
'''
from renderEngine.AjaxApplicationBase import AjaxApplicationBase
from mycoplasma_home.models import TagGroup, TagPoint, Picture
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist

NO_ERROR = 0,
INVALID_IMAGE_KEY = 1
NO_IMAGE_KEY = 2

class Application(AjaxApplicationBase):
	def doProcessRender(self, request):
		errorCode = NO_ERROR
		
		if request.REQUEST.has_key('imageKey'):
			# the key for lookup and the image it is attached to
			imageKey = request.REQUEST['imageKey']
			try:
				image = Pictures.objects.get(pk__exact=imageKey) 
				
				tagGroups = TagGroup.objects.filter(picture__exact=image)
				
				tagTuples = list()
				
				for group in tagGroups:
					tagPoints = TagPoint.objects.filter(group__exact = group).order_by('rank')
					points = []
					
					for tagPoint in tagPoints:
						points.append([tagPoint.pointX, tagPoint.pointY])
					
					color = [group.color.red, group.color.green, group.color.blue]
					
					tagTuples.append({
						'color' : color,
						'points' : points,
						'description' : group.description
					})
			except ObjectDoesNotExist:
				errorCode = INVALID_IMAGE_KEY
		else:
			errorCode = NO_IMAGE_KEY
		
		renderObj = {
			'error' : errorCode != NO_ERROR,
			'errorCode' : errorCode,
			'tags' : tagTuples
		}

		self.setJsonObject(renderObj)
'''
	Used for mapping to the url in urls.py
'''
@csrf_exempt
def renderAction(request):
	return Application().render(request)
