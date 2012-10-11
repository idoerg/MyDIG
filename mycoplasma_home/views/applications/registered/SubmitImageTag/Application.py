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
			try:
				descriptionIn = request.POST['description']
				colorIn = request.POST['color']
				numPoints = int(request.POST['numPoints'])
				imageKey = request.POST['imageKey']
				image = Picture.objects.get(pk__exact=imageKey) 
				pointsArr = list()
	
				for i in range(numPoints):
					pointsArr.append((request.POST['point' + str(i) + '_x'], request.POST['point' + str(i) + '_y']))
				
				tagGroup = TagGroup(description=descriptionIn, color=colorIn, picture=image)			
				tagGroup.save()
				
				for (counter, point) in enumerate(pointsArr):
					tagPoint = TagPoint(group=tagGroup, pointX=point[0], pointY=point[1], rank=counter+1)
					tagPoint.save()
				
				renderObj = {
					'error' : False,
					'errorMessage' : ''
				}
		
				self.setJsonObject(renderObj)	
			except (KeyError):
				errorMessage = "Problem with POST arguments"
		else: 
			errorMessage = "Page requires a POST action"
		
		self.setJsonObject({
			'error' : True,
			'errorMessage' : errorMessage
		})

		
'''
	Used for mapping to the url in urls.py
'''
@csrf_exempt			
def renderAction(request):
	return Application().render(request)
