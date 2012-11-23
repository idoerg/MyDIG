'''
	Ajax Application for the Image Pagination
	URL: /administration/addNewTag
	
	Author: Andrew Oberlin
	Date: July 23, 2012
'''
from renderEngine.AjaxRegisteredApplicationBase import AjaxRegisteredApplicationBase
from django.views.decorators.csrf import csrf_exempt
from mycoplasma_home.models import TagColor, Tag, TagGroup, TagPoint
from django.core.exceptions import ObjectDoesNotExist

class Application(AjaxRegisteredApplicationBase):
	def doProcessRender(self, request):
		errorMessage = None
		errorTagGroups = []
		if (request.method == "POST"):
			try:
				tagGroupKeys = request.POST['tagGroupKeys']
				description = request.POST['description']
				points = request.POST['points']
				color = request.POST['color']
				
				if (len(color) >= 3):
					# first check if the color exists
					(tagColor, ) = TagColor.objects.get_or_create(red=color[0], blue=color[1], green=color[2])
					for key in tagGroupKeys:
						try:
							tagGroup = TagGroup.objects.get(pk__exact=key)
							if (tagGroup.picture.isPrivate and request.user == tagGroup.user) or not tagGroup.picture.isPrivate:
								newTag = Tag(description=description, color=tagColor, group=tagGroup, user=request.user)
								newTag.save()
								
								for (counter, point) in enumerate(points):
									newTagPoint = TagPoint(tag=newTag, pointX=point[0], pointY=point[1], rank=counter+1)
									newTagPoint.save()
							else:
								errorMessage = "Incorrect permissions for editing this image or tag group"
						except ObjectDoesNotExist:
							errorTagGroups.append(key)
					
				else:
					errorMessage = "Incorrect format for color"	
			except KeyError as e:
				errorMessage = "Missing arguments in save for key: " + e
		else:
			errorMessage = "Incorrect method for saving a tag"

		if (errorMessage == "" and len(errorTagGroups) == 0):
			self.setJsonObject({
				'error' : False
			})
		elif len(errorTagGroups) > 0:
			self.setJsonObject({
				'error' : True,
				'errorMessage' : errorMessage + ' and these tag groups do not exist',
				'errorTagGroups' : errorTagGroups 
			})
		else:
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
