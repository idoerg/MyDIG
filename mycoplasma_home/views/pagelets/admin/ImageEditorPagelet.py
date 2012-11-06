'''
    Pagelet for the Image Editor which is both an admin
    and a public application

    Author: Andrew Oberlin
    Date: August 5, 2012
'''

from renderEngine.PageletBase import PageletBase
from django.forms.models import model_to_dict
import simplejson as json
from mycoplasma_home.models import Picture, Tag, TagPoint, PictureDefinitionTag, Organism
from django.core.exceptions import ObjectDoesNotExist

class ImageEditorPagelet(PageletBase):
    '''
        Renders the center of the home page        
    
        Params: request -- the Django request object with the POST & GET args
        
        Returns: Dictionary of arguments for rendering this pagelet
    '''
    def doProcessRender(self, request):
        self.setLayout('admin/imageEditor.html')

        try:
            imageKey = request.REQUEST['imageKey']
            image = Picture.objects.get(pk__exact=imageKey)    
            
            defTags = PictureDefinitionTag.objects.filter(picture__exact=image)
            
            organisms = []
            
            for tag in defTags:
                try:
                    organisms.append(model_to_dict(Organism.objects.get(pk__exact=tag.organism_id), fields=['organism_id', 'common_name']))
                except ObjectDoesNotExist:
                    None
            
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
    
            return {
                'organisms' : json.dumps(organisms),
                'tags' : tagTuples,
                'image' : image
            }
        except ObjectDoesNotExist:
            self.setLayout('public/404Media.html')
            return {}
        except KeyError:
            self.setLayout('public/404Media.html')
            return {}