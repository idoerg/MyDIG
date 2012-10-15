'''
	Ajax Application for getting tags related to the image
	URL: /image_change
	
	Author: Andrew Oberlin
	Date: July 23, 2012
'''
from renderEngine.AjaxApplicationBase import WebServiceApplicationBase
from mycoplasma_home.models import TagGroup, TagPoint, Picture
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist

NO_ERROR = 'Success'
INVALID_IMAGE_KEY = 'Invalid Image Key Provided'
NO_IMAGE_KEY = 'No Image Key Provided'

class Application(WebServiceApplicationBase):
	def doProcessRender(self, request):
		errorMessage = NO_ERROR
		tagTuples = list()
		
		if request.REQUEST.has_key('imageKey'):
			# the key for lookup and the image it is attached to
			imageKey = request.REQUEST['imageKey']
			try:
				image = Picture.objects.get(pk__exact=imageKey) 
				
				tagGroups = TagGroup.objects.filter(picture__exact=image)
				
				for group in tagGroups:
					tagPoints = TagPoint.objects.filter(group__exact = group).order_by('rank')
					points = []
					
					for tagPoint in tagPoints:
						points.append([
							tagPoint.pointX, 
							tagPoint.pointY
						])
					
					color = [group.color.red, group.color.green, group.color.blue]
					
					tagTuples.append({
						'color' : color,
						'points' : points,
						'description' : group.description
					})
			except ObjectDoesNotExist:
				errorMessage = INVALID_IMAGE_KEY
		else:
			errorMessage = NO_IMAGE_KEY
		
		renderObj = {
			'error' : errorMessage != NO_ERROR,
			'errorMessage' : errorMessage,
			'tags' : tagTuples
		}

		self.setJsonObject(renderObj)
'''
	Used for mapping to the url in urls.py
'''
@csrf_exempt
def renderAction(request):
	return Application().render(request)
