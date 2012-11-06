'''
    Pagelet for the Image Editor which is both an admin
    and a public application

    Author: Andrew Oberlin
    Date: August 5, 2012
'''
from renderEngine.PageletBase import PageletBase
from mycoplasma_home.models import Picture, Tag, TagPoint, RecentlyViewedPicture
from django.core.exceptions import ObjectDoesNotExist

class ImageEditorPagelet(PageletBase):
    '''
        Renders the center of the home page        
    
        Params: request -- the Django request object with the POST & GET args
        
        Returns: Dictionary of arguments for rendering this pagelet
    '''
    def doProcessRender(self, request):
        self.setLayout('public/imageEditor.html')
        try:
            imageKey = request.REQUEST['imageKey']
            image = Picture.objects.get(pk__exact=imageKey)
            
            error = False
            
            if (image.isPrivate):
                if (request.user.is_authenticated() or image.user != request.user):
                    error = True
            
            if (not error):
                tags = Tag.objects.filter(picture__exact=image)
                
                tagTuples = list()
                
                for tag in tags:
                    tagPoints = TagPoint.objects.filter(tag__exact = tag).order_by('rank')
                    points = []
                    
                    for tagPoint in tagPoints:
                        points.append([tagPoint.pointX, tagPoint.pointY])
                    
                    color = [tag.color.red, tag.color.green, tag.color.blue]
                    
                    tagTuples.append({
                        'color' : color,
                        'points' : points,
                        'description' : tag.description
                    })
                
                if (request.user.is_authenticated()):
                    recentlyViewed = RecentlyViewedPicture.objects.get_or_create(picture=image, user=request.user)
                    recentlyViewed[0].save()
                
                return {
                    'tags' : tagTuples,
                    'image' : image
                }
            else:
                self.setLayout('public/404Media.html')
                return {}
        except ObjectDoesNotExist:
            self.setLayout('public/404Media.html')
            return {}
        except KeyError:
            self.setLayout('public/404Media.html')
            return {}