from django.db import models
from django.contrib.auth.models import User
from datetime import datetime
import os

class NavBarOption(models.Model):
    optionName = models.CharField(max_length=20)
    href = models.CharField(max_length=100)
    rank = models.IntegerField()
    def __unicode__(self):
        return self.optionName

class DropDownItem(models.Model):
    itemName = models.CharField(max_length=20)
    navBarOpt = models.ForeignKey(NavBarOption)
    href = models.CharField(max_length=100, unique=False)
    rank = models.IntegerField()
    def __unicode__(self):
        return self.itemName

class Picture(models.Model):
    description = models.TextField(blank=True, null=True)
    imageName = models.ImageField(upload_to="pictures/")
    publication = models.CharField(max_length=50, blank=True, null=True)
    altText = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User)
    uploadDate = models.DateTimeField(auto_now_add=True)
    isPrivate = models.BooleanField(default=False, null=False)
    
    def delete(self, *args, **kwargs):
        path = self.imageName.path
        super(Picture, self).delete(*args, **kwargs)
        if (os.path.exists(path)):
            os.remove(path)
    
    def __unicode__(self):
        return str(self.imageName.name)

class PictureType(models.Model):
    description = models.CharField(max_length=50)
    imageType = models.CharField(max_length=15)
    def __unicode__(self):
        return self.imageType

class PictureProp(models.Model):
    picture_id = models.ForeignKey(Picture)
    type_id = models.ForeignKey(PictureType)
    def __unicode__(self):
        return ", ".join((str(self.picture_id), str(self.type_id)))
    class Meta:
        unique_together = ('picture_id','type_id')

class PictureDefinitionTag(models.Model):
    picture = models.ForeignKey(Picture)
    organism_id = models.IntegerField()
    name = models.TextField()
    def __unicode__(self):
        return ", ".join((str(self.picture_id), str(self.name)))
    
class RecentlyViewedPicture(models.Model):
    picture = models.ForeignKey(Picture)
    user = models.ForeignKey(User)
    lastDateViewed = models.DateTimeField()
    
    def save(self, *args, **kwargs):
        self.lastDateViewed = datetime.now()
        super(RecentlyViewedPicture, self).save(*args, **kwargs)
    
    class Meta:
        unique_together = ("picture", "user")
    
    def __unicode__(self):
        return (self.picture.imageName.name) + " viewed by " + self.user.username

class TagGroup(models.Model):
    name = models.TextField()
    user = models.ForeignKey(User)
    picture = models.ForeignKey(Picture)
    dateCreated = models.DateTimeField(auto_now_add=True, editable=False)
    lastModified = models.DateTimeField(auto_now=True)
    def __unicode__(self):
        return self.name

class TagColor(models.Model):
    red = models.IntegerField()
    green = models.IntegerField()
    blue = models.IntegerField()
    def __unicode__(self):
        return 'R: ' + str(self.red) + ', G: ' + str(self.green) + ', B: ' + str(self.blue)

class Tag(models.Model):
    description = models.CharField(max_length=50)
    color = models.ForeignKey(TagColor)
    user = models.ForeignKey(User)
    group = models.ForeignKey(TagGroup)
    def __unicode__(self):
        return self.description
    
class TagPoint(models.Model):
    tag = models.ForeignKey(Tag)
    pointX = models.IntegerField()
    pointY = models.IntegerField()
    rank = models.IntegerField()
    def __unicode__(self):
        return "(" + str(self.pointX) + "," + str(self.pointY) + ") " + self.tag.description
        
class BlastUpload(models.Model):
    fasta_file = models.FileField(upload_to="fasta_files/")
    name = models.TextField()
    def __unicode__(self):
        return self.name

class GenomeUpload(models.Model):
    genbank_file = models.FileField(upload_to="genbank_files/")
    name = models.TextField()
    def __unicode__(self):
        return self.name
        
class Landmark(models.Model):
    name = models.CharField(max_length=10)
    organism_id = models.IntegerField()
    def __unicode__(self):
        return self.name
