
TypePoint = 0;
TypeArea = 1;
TypeLine = 2;
TypeEllipse = 3;

EmInwards = 0;
EmOutwards = 1;
EmSpecified = 2;
EmInAndOut = 3;

EndKill = 0;
EndLoopAround = 1;
EndLetFree = 2;


var Effect = Class(Entity,{
  constructor: function() {

    this._class = TypePoint;
    this._currentEffectFrame = 0;
    this._handleCenter = false;
    this._source = null;
    this._lockAspect = true;
    this._particlesCreated = false;
    this._suspendTime = 0;
    this._gx = 0;
    this._gy = 0;
    this._mgx = 0;
    this._mgy = 0;
    this._emitAtPoints = false;
    this._emissionType = EmInwards;
    this._effectLength = 0;
    this._parentEmitter = null;
    this._spawnAge = 0;
    this._index = 0;
    this._particleCount = 0;
    this._idleTime = 0;
    this._traverseEdge = false;
    this._endBehavior = EndKill;
    this._distanceSetByLife = false;
    this._reverseSpawn = false;
    this._spawnDirection = 1;
    this._dying = false;
    this._allowSpawning = true;
    this._ellipseArc = 360.0;
    this._ellipseOffset = 0;
    this._effectLayer = 0;
    this._doesNotTimeout = false;

    this._particleManager = null;

    this._frames = 32;
    this._animWidth = 128;
    this._animHeight = 128;
    this._looped = false;
    this._animX = 0;
    this._animY = 0;
    this._seed = 0;
    this._zoom = 1.0;
    this._frameOffset = 0;

    this._currentLife = 0;
    this._currentAmount = 0;
    this._currentSizeX = 0;
    this._currentSizeY = 0;
    this._currentVelocity = 0;
    this._currentSpin = 0;
    this._currentWeight = 0;
    this._currentWidth = 0;
    this._currentHeight = 0;
    this._currentAlpha = 0;
    this._currentEmissionAngle = 0;
    this._currentEmissionRange = 0;
    this._currentStretch = 0;
    this._currentGlobalZ = 0;

    this._overrideSize = false;
    this._overrideEmissionAngle = false;
    this._overrideEmissionRange = false;
    this._overrideAngle = false;
    this._overrideLife = false;
    this._overrideAmount = false;
    this._overrideVelocity = false;
    this._overrideSpin = false;
    this._overrideSizeX = false;
    this._overrideSizeY = false;
    this._overrideWeight = false;
    this._overrideAlpha = false;
    this._overrideStretch = false;
    this._overrideGlobalZ = false;

    this._bypassWeight = false;

    this._arrayOwner = true;

    this._inUse = [];
    for(var i=0;i<10;i++)
      this._inUse[i] = [];

    this._cAmount = new EmitterArray(EffectsLibrary.globalPercentMin, EffectsLibrary.globalPercentMax);
    this._cLife = new EmitterArray(EffectsLibrary.globalPercentMin, EffectsLibrary.globalPercentMax);
    this._cSizeX = new EmitterArray(EffectsLibrary.globalPercentMin, EffectsLibrary.globalPercentMax);
    this._cSizeY = new EmitterArray(EffectsLibrary.globalPercentMin, EffectsLibrary.globalPercentMax);
    this._cVelocity = new EmitterArray(EffectsLibrary.globalPercentMin, EffectsLibrary.globalPercentMax);
    this._cWeight = new EmitterArray(EffectsLibrary.globalPercentMin, EffectsLibrary.globalPercentMax);
    this._cSpin = new EmitterArray(EffectsLibrary.globalPercentMin, EffectsLibrary.globalPercentMax);
    this._cAlpha = new EmitterArray(0, 1.0);
    this._cEmissionAngle = new EmitterArray(EffectsLibrary.angleMin, EffectsLibrary.angleMax);
    this._cEmissionRange = new EmitterArray(EffectsLibrary.emissionRangeMin, EffectsLibrary.emissionRangeMax);
    this._cWidth = new EmitterArray(EffectsLibrary.dimensionsMin, EffectsLibrary.dimensionsMax);
    this._cHeight = new EmitterArray(EffectsLibrary.dimensionsMin, EffectsLibrary.dimensionsMax);
    this._cEffectAngle = new EmitterArray(EffectsLibrary.angleMin, EffectsLibrary.angleMax);
    this._cStretch = new EmitterArray(EffectsLibrary.globalPercentMin, EffectsLibrary.globalPercentMax);
    this._cGlobalZ = new EmitterArray(EffectsLibrary.globalPercentMin, EffectsLibrary.globalPercentMax);

    Effect.$super.call(this);        // Call parent's constructor
  },

  HideAll:function()
  {
      for (var i=0;i<this._children.length;i++)
      {
          this._children[i].HideAll();
      }
  },

  GetEffectLayer:function()
  {
      return this._effectLayer;
  },

  SetEffectLayer:function( layer )
  {
      this._effectLayer = layer;
  },

  ShowOne:function( e )
  {
    for (var i=0;i<this._children.length;i++)
    {
        this._children[i].SetVisible(false);
    }
    e.SetVisible(true);
  },

  EmitterCount:function()
  {
      return this._children.length;
  },

  SetParticleManager:function( particleManager )
  {
      this._particleManager = particleManager;
  },

  Update:function()
  {
      this.Capture();

      this._age = this._particleManager.GetCurrentTime() - this._dob;

      if (this._spawnAge < this._age)
          this._spawnAge = this._age;

      if (this._effectLength > 0 && this._age > this._effectLength)
      {
          this._dob = this._particleManager.GetCurrentTime();
          this._age = 0;
      }

      this._currentEffectFrame = this._age / EffectsLibrary.GetLookupFrequency();

      if (!this._overrideSize)
      {
          switch (this._class)
          {
          case TypePoint:
              this._currentWidth = 0;
              this._currentHeight = 0;
              break;
          case TypeArea:
          case TypeEllipse:
              this._currentWidth = GetWidth(this._currentEffectFrame);
              this._currentHeight = GetHeight(this._currentEffectFrame);
              break;
          case TypeLine:
              this._currentWidth = GetWidth(this._currentEffectFrame);
              this._currentHeight = 0;
              break;
          }
      }

      // can be optimized
      if (this._handleCenter && this._class !== TypePoint)
      {
          this._handleX = this._currentWidth * 0.5;
          this._handleY = this._currentHeight * 0.5;
      }
      else
      {
          this._handleX = 0;
          this._handleY = 0;
      }

      if (this.HasParticles() || this._doesNotTimeout)
      {
          this._idleTime = 0;
      }
      else
      {
          ++this._idleTime;
      }

      if (this._parentEmitter)
      {
          var parentEffect = this._parentEmitter.GetParentEffect();
          if (!this._overrideLife)          this._currentLife          = this.GetLife(this._currentEffectFrame)     * parentEffect._currentLife;
          if (!this._overrideAmount)        this._currentAmount        = this.GetAmount(this._currentEffectFrame)   * parentEffect._currentAmount;
          if (this._lockAspect)
          {
              if (!this._overrideSizeX)     this._currentSizeX         = this.GetSizeX(this._currentEffectFrame)  * parentEffect._currentSizeX;
              if (!this._overrideSizeY)     this._currentSizeY         = this._currentSizeX                       * parentEffect._currentSizeY;
          }
          else
          {
              if (!this._overrideSizeX)     this._currentSizeX         = this.GetSizeX(this._currentEffectFrame)    * parentEffect._currentSizeX;
              if (!this._overrideSizeY)     this._currentSizeY         = this.GetSizeY(this._currentEffectFrame)    * parentEffect._currentSizeY;
          }
          if (!this._overrideVelocity)      this._currentVelocity      = this.GetVelocity(this._currentEffectFrame) * parentEffect._currentVelocity;
          if (!this._overrideWeight)        this._currentWeight        = this.GetWeight(this._currentEffectFrame)   * parentEffect._currentWeight;
          if (!this._overrideSpin)          this._currentSpin          = this.GetSpin(this._currentEffectFrame)     * parentEffect._currentSpin;
          if (!this._overrideAlpha)         this._currentAlpha         = this.GetAlpha(this._currentEffectFrame)    * parentEffect._currentAlpha;
          if (!this._overrideEmissionAngle) this._currentEmissionAngle = this.GetEmissionAngle(this._currentEffectFrame);
          if (!this._overrideEmissionRange) this._currentEmissionRange = this.GetEmissionRange(this._currentEffectFrame);
          if (!this._overrideAngle)         this._angle                = this.GetEffectAngle(this._currentEffectFrame);
          if (!this._overrideStretch)       this._currentStretch       = this.GetStretch(this._currentEffectFrame)  *  parentEffect._currentStretch;
          if (!this._overrideGlobalZ)       this._currentGlobalZ       = this.GetGlobalZ(this._currentEffectFrame)  *  parentEffect._currentGlobalZ;
      }
      else
      {
          if (!this._overrideLife)          this._currentLife          = this.GetLife(this._currentEffectFrame);
          if (!this._overrideAmount)        this._currentAmount        = this.GetAmount(this._currentEffectFrame);
          if (this._lockAspect)
          {
              if (!this._overrideSizeX)     this._currentSizeX         = this.GetSizeX(this._currentEffectFrame);
              if (!this._overrideSizeY)     this._currentSizeY         = this._currentSizeX;
          }
          else
          {
              if (!this._overrideSizeX)     this._currentSizeX         = this.GetSizeX(this._currentEffectFrame);
              if (!this._overrideSizeY)     this._currentSizeY         = this.GetSizeY(this._currentEffectFrame);
          }
          if (!this._overrideVelocity)      this._currentVelocity      = this.GetVelocity(this._currentEffectFrame);
          if (!this._overrideWeight)        this._currentWeight        = this.GetWeight(this._currentEffectFrame);
          if (!this._overrideSpin)          this._currentSpin          = this.GetSpin(this._currentEffectFrame);
          if (!this._overrideAlpha)         this._currentAlpha         = this.GetAlpha(this._currentEffectFrame);
          if (!this._overrideEmissionAngle) this._currentEmissionAngle = this.GetEmissionAngle(this._currentEffectFrame);
          if (!this._overrideEmissionRange) this._currentEmissionRange = this.GetEmissionRange(this._currentEffectFrame);
          if (!this._overrideAngle)         this._angle                = this.GetEffectAngle(this._currentEffectFrame);
          if (!this._overrideStretch)       this._currentStretch       = this.GetStretch(this._currentEffectFrame);
          if (!this._overrideGlobalZ)       this._currentGlobalZ       = this.GetGlobalZ(this._currentEffectFrame);
      }

      if (!this._overrideGlobalZ)
          this._z = this._currentGlobalZ;

      if (this._currentWeight === 0)
          this._bypassWeight = true;

      if (this._parentEmitter)
          this._dying = this._parentEmitter.IsDying();

      Effect.$superp.Update.call( this );

       if (this._idleTime > this._particleManager.GetIdleTimeLimit())
           this._dead = 1;

       if (this._dead)
       {
           if (this.GetChildCount() === 0)
           {
               this.Destroy();
               return false;
           }
           else
           {
               this.KillChildren();
           }
       }

       return true;
  },

  HasParticles:function()
  {
      for (var i=0;i<this._children.length;i++)
      {
          if(this._children[i].GetChildCount() > 0)
            return true;
      }

      return false;
  },

  SoftKill:function()
  {
      this._dying = true;
  },

  HardKill:function()
  {
      this._particleManager.RemoveEffect(this);
      this.Destroy();
  },

  Destroy:function(releaseChildren)
  {
      this._parentEmitter = null;
      this._directoryEffects = [];
      this._directoryEmitters  = [];
      for (var i = 0; i < this._inUse.length; i++)
      {
          while (this._inUse[i].length !== 0)
          {
              var p = this._inUse[i].pop();
              p.Reset();
              this._particleManager.ReleaseParticle(p);
              this.RemoveInUse(i, p);
          }
          this._inUse[i] = [];
      }

      Effect.$superp.Destroy.call( this, releaseChildren );
  },

  RemoveInUse:function( layer, p )
  {
    RemoveFromList(this._inUse[layer],p);
  },

  CompileAll:function()
  {
      this.CompileLife();
      this.CompileAmount();
      this.CompileSizeX();
      this.CompileSizeY();
      this.CompileVelocity();
      this.CompileWeight();
      this.CompileSpin();
      this.CompileAlpha();
      this.CompileEmissionAngle();
      this.CompileEmissionRange();
      this.CompileWidth();
      this.CompileHeight();
      this.CompileAngle();
      this.CompileStretch();
      this.CompileGlobalZ();

      for (var i=0;i<this._children.length;i++)
      {
          this._children[i].CompileAll();
      }
  },

  CompileQuick:function()
 {
   for (var i=0;i<this._children.length;i++)
   {
       var e = this._children[i];
       e.CompileQuick();
       e.ResetBypassers();
   }
 },

 CompileAmount:function()
 {
     this._cAmount.Compile();
 },

 CompileLife:function()
 {
     this._cLife.Compile();
 },

 CompileSizeX:function()
 {
     this._cSizeX.Compile();
 },

 CompileSizeY:function()
 {
     this._cSizeY.Compile();
 },

 CompileVelocity:function()
 {
     this._cVelocity.Compile();
 },

 CompileWeight:function()
 {
     this._cWeight.Compile();
 },

 CompileSpin:function()
 {
     this._cSpin.Compile();
 },

 CompileAlpha:function()
 {
     this._cAlpha.Compile();
 },

 CompileEmissionAngle:function()
 {
     this._cEmissionAngle.Compile();
 },

 CompileEmissionRange:function()
 {
     this._cEmissionRange.Compile();
 },

 CompileWidth:function()
 {
     this._cWidth.Compile();
 },

 CompileHeight:function()
 {
     this._cHeight.Compile();
 },

 CompileAngle:function()
 {
     this._cEffectAngle.Compile();
 },

 CompileStretch:function()
 {
     this._cStretch.Compile();
 },

 CompileGlobalZ:function()
 {
     this._cGlobalZ.Compile();
     this._cGlobalZ.SetCompiled(0, 1.0);
 },

 GetLife:function( frame )
 {
     return this._cLife.Get(frame);
 },

 GetAmount:function( frame )
 {
     return this._cAmount.Get(frame);
 },

 GetSizeX:function( frame )
 {
     return this._cSizeX.Get(frame);
 },

 GetSizeY:function( frame )
 {
     return this._cSizeY.Get(frame);
 },

 GetVelocity:function( frame )
 {
     return this._cVelocity.Get(frame);
 },

 GetWeight:function( frame )
 {
     return this._cWeight.Get(frame);
 },

 GetSpin:function( frame )
 {
     return this._cSpin.Get(frame);
 },

 GetAlpha:function( frame )
 {
     return this._cAlpha.Get(frame);
 },

 GetEmissionAngle:function( frame )
 {
     return this._cEmissionAngle.Get(frame);
 },

 GetEmissionRange:function( frame )
 {
     return this._cEmissionRange.Get(frame);
 },

 GetWidth:function( frame )
 {
     return this._cWidth.Get(frame);
 },

 GetHeight:function( frame )
 {
     return this._cHeight.Get(frame);
 },

 GetEffectAngle:function( frame )
 {
     return this._cEffectAngle.Get(frame);
 },

 GetStretch:function( frame )
 {
     return this._cStretch.Get(frame);
 },

 GetGlobalZ:function( frame )
 {
     return this._cGlobalZ.Get(frame);
 },

  LoadFromXML:function(xml)
  {
    var x = new XMLHelper(xml);
    this._class  = x.GetAttr("TYPE");
    this._emitAtPoints = x.GetAttr("EMITATPOINTS");
    this._mgx = x.GetAttr("MAXGX");
    this._mgy = x.GetAttr("MAXGY");

    this._emissionType = x.GetAttr("EMISSION_TYPE");
    this._effectLength = x.GetAttr("EFFECT_LENGTH");
    this._ellipseArc = x.GetAttr("ELLIPSE_ARC");

    this._handleX = x.GetAttr("HANDLE_X");
    this._handleY = x.GetAttr("HANDLE_Y");

    this._lockAspect = x.GetAttr("UNIFORM");
    this._handleCenter = x.GetAttr("HANDLE_CENTER");
    this._traverseEdge = x.GetAttr("TRAVERSE_EDGE");

    this._name = x.GetAttr("NAME");
    this._endBehavior = x.GetAttr("END_BEHAVIOUR");
    this._distanceSetByLife = x.GetAttr("DISTANCE_SET_BY_LIFE");
    this._reverseSpawn = x.GetAttr("REVERSE_SPAWN_DIRECTION");

    // Build path
    this._path = this._name;
    var p = xml.parentNode;
    while(p)
    {
      var parentName = GetXMLAttrSafe(p,"NAME");
      if(parentName !== "")
        this._path = parentName + "/" + this._path;

      p = p.parentNode;
    }

    var animProps = xml.getElementsByTagName("ANIMATION_PROPERTIES")[0];
    if(animProps)
    {
      var a = new XMLHelper(animProps);
      this._frames = a.GetAttr("FRAMES");
      this._animWidth = a.GetAttr("WIDTH");
      this._animHeight = a.GetAttr("HEIGHT");
      this._animX = a.GetAttr("X");
      this._animY = a.GetAttr("Y");
      this._seed = a.GetAttr("SEED");
      this._looped = a.GetAttr("LOOPED");
      this._zoom = a.GetAttr("ZOOM");
      this._frameOffset = a.GetAttr("FRAME_OFFSET");
    }

/*
    var _this = this;
    ForEachInXMLNodeList(xml.getElementsByTagName("AMOUNT"), function(n){
        var attr = _this.AddAmount(GetNodeAttrValue(n,"FRAME"), GetNodeAttrValue(n,"VALUE"));
        attr.LoadFromXML(n.getElementsByTagName("CURVE")[0]);
      }
    );
*/
    this.ReadAttribute( xml, this.AddAmount.bind(this), "AMOUNT" );
    this.ReadAttribute( xml, this.AddLife.bind(this), "LIFE" );
    this.ReadAttribute( xml, this.AddSizeX.bind(this), "SIZEX" );
    this.ReadAttribute( xml, this.AddSizeY.bind(this), "SIZEY" );
    this.ReadAttribute( xml, this.AddVelocity.bind(this), "VELOCITY" );
    this.ReadAttribute( xml, this.AddWeight.bind(this), "WEIGHT" );
    this.ReadAttribute( xml, this.AddSpin.bind(this), "SPIN" );

    this.ReadAttribute( xml, this.AddAlpha.bind(this), "ALPHA" );
    this.ReadAttribute( xml, this.AddEmissionAngle.bind(this), "EMISSIONANGLE" );
    this.ReadAttribute( xml, this.AddEmissionRange.bind(this), "EMISSIONRANGE" );
    this.ReadAttribute( xml, this.AddWidth.bind(this), "AREA_WIDTH" );
    this.ReadAttribute( xml, this.AddHeight.bind(this), "AREA_HEIGHT" );

    this.ReadAttribute( xml, this.AddAngle.bind(this), "ANGLE" );
    this.ReadAttribute( xml, this.AddStretch.bind(this), "STRETCH" );


/*
    var amt = xml.getElementsByTagName("AMOUNT");
    console.log(amt);
    for(var i=0;i<amt.length;i++)
    {
        var elem = amt[i];
        console.log(elem);
    }
    */

    // Child()
    // Sibling()
/*
    for (var attrnode = node.child("AMOUNT"); attrnode; attrnode = attrnode.next_sibling("AMOUNT"))
    {
        attr = e.
        (attrnode.attribute("FRAME").as_float(), attrnode.attribute("VALUE").as_float());
        LoadAttributeNode(attrnode, attr);
    }
*/

  },

  ReadAttribute:function(xml,fn,tag)
  {
    ForEachInXMLNodeList(xml.getElementsByTagName(tag), function(n){
        var attr = fn(GetNodeAttrValue(n,"FRAME"), GetNodeAttrValue(n,"VALUE"));
        attr.LoadFromXML(n.getElementsByTagName("CURVE")[0]);
      }
    );
  },

  AddAmount:function( f, v )
  {
      return this._cAmount.Add(f, v);
  },

  AddLife:function( f,v )
  {
      return this._cLife.Add(f, v);
  },

  AddSizeX:function( f,v )
  {
      return this._cSizeX.Add(f, v);
  },

  AddSizeY:function( f,v )
  {
      return this._cSizeY.Add(f, v);
  },

  AddVelocity:function( f,v )
  {
      return this._cVelocity.Add(f, v);
  },

  AddWeight:function( f,v )
  {
      return this._cWeight.Add(f, v);
  },

  AddSpin:function( f,v )
  {
      return this._cSpin.Add(f, v);
  },

  AddAlpha:function( f,v )
  {
      return this._cAlpha.Add(f, v);
  },

  AddEmissionAngle:function( f,v )
  {
      return this._cEmissionAngle.Add(f, v);
  },

  AddEmissionRange:function( f,v )
  {
      return this._cEmissionRange.Add(f, v);
  },

  AddWidth:function( f,v )
  {
      return this._cWidth.Add(f, v);
  },

  AddHeight:function( f,v )
  {
      return this._cHeight.Add(f, v);
  },

  AddAngle:function( f,v )
  {
      return this._cEffectAngle.Add(f, v);
  },

  AddStretch:function( f,v )
  {
      return this._cStretch.Add(f, v);
  },

  AddGlobalZ:function( f,v )
  {
      return this._cGlobalZ.Add(f, v);
  },

  GetPath:function()
  {
      return this._path;
  },


});
