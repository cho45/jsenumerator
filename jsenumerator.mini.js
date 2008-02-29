// JSEnumerator 0.0.0 (c) Copyright (c) 2008 KAYAC Inc. ( http://www.kayac.com/ )
function Enumerator(a){
return(arguments.length>1)? new Enumerator().initWithArray(arguments):
(this instanceof Enumerator)? this.init(a):new Enumerator(a);}
Enumerator.prototype={
init:function(){
if(arguments.length==0){
this.initWithArray([]);}else{
if(typeof arguments[0]=="function"){
this.initWithFunction(arguments[0]);}else
if(typeof arguments[0]=="object"){
if(arguments[0].hasOwnProperty("length")){
this.initWithArray(arguments[0]);}else
if(arguments[0] instanceof Enumerator){
return arguments[0];}else{
this.initWithHash(arguments[0]);}
}else{
this.initWithArray([arguments[0]]);}
}
},
initWithFunction:function(fun){
this.next=fun;return this;},
initWithArray:function(array){
this.array=array;this.pos=0;this.initWithFunction(function(){
if(this.pos<array.length){
return array[this.pos++];}else{
throw Enumerator.StopIteration;}
});return this;},
initWithHash:function(hash){
var arr=[];for(var k in hash)if(hash.hasOwnProperty(k)){
arr.push([k,hash[k]]);}
this.initWithArray(arr);return this;},
toArray:function(){
return this.map(function(x){return x});},
cycle:function(){
var self=this,cache=[];return Enumerator(function(){
try{
var i=self.next();cache.push(i);return i;}catch(e){
if(e !=Enumerator.StopIteration)throw e;var i=-1;this.next=function(){return cache[++i % cache.length]};return this.next();}
});},
map:function(fun,apply){
var ret=[];try{
if(this.array){
for(;this.pos<this.array.length;this.pos++){
ret.push(fun[apply || "call"](this,this.array[this.pos]));}
}else{
while(1)ret.push(fun[apply || "call"](this,this.next()));}
}catch(e){
if(e !=Enumerator.StopIteration)throw e;}
return ret;},
imap:function(fun,apply){
var self=this;return Enumerator(function(){
return fun[apply || "call"](this,self.next())
});},
izip:function(){
var eles=[this];eles.push.apply(eles,Enumerator(arguments).map(function(i){
return Enumerator(i);}));return Enumerator(function(){
var args=[];for(var i=0;i<eles.length;i++)args.push(eles[i].next());return args;});},
iselect:function(fun,apply){
var self=this;return Enumerator(function(){
do{
var val=self.next();}while(!fun[apply || "call"](this,val));return val;});},
find:function(fun,apply){
do{
var ret=this.next();}while(!fun[apply || "call"](this,ret));return ret;},
reduce:function(fun,init){
var self=this;var rval=(typeof init=="undefined")? self.next():init;this.each(function(i){rval=fun.call(this,rval,i)});return rval;},
max:function(fun){
if(!fun)fun=function(a,b){return a-b};var t=this.toArray().sort(fun)
return t[t.length-1];},
min:function(fun){
if(!fun)fun=function(a,b){return a-b};var t=this.toArray().sort(fun)
return t[0];},
chain:function(enums){
var f=this,a=Enumerator(arguments).imap(function(i){
return Enumerator(i);});return Enumerator(function(){
try{
return f.next();}catch(e){
if(e !=Enumerator.StopIteration)throw e;f=a.next();return f.next();}
});},
itake:function(a,apply){
var self=this;if(typeof(a)=="number"){
var i=0;return Enumerator(function(){
if(i++<a)
return self.next();else
throw Enumerator.StopIteration;});}else
if(typeof(a)=="function"){
return Enumerator(function(){
var ret=self.next();if(a[apply || "call"](this,ret))
return ret;else
throw Enumerator.StopIteration;});return ret;}
},
take:function(a,apply){
return this.itake(a,apply).toArray();},
idrop:function(a,apply){
var self=this,i;if(typeof(a)=="number"){
for(i=0;i<a;i++)this.next();return this;}else
if(typeof(a)=="function"){
while(a[apply || "call"](this,i=this.next()))true;return Enumerator(function(){
this.next=self.next;return i;});}
},
drop:function(a,apply){
return this.idrop(a,apply).toArray();},
every:function(fun,apply){
try{
while(!(fun[apply || "call"](this,this.next())===false))1;return false;}catch(e){
if(e !=Enumerator.StopIteration)throw e;return true;}
},
some:function(fun,apply){
try{
while(!(fun[apply || "call"](this,this.next())===true))1;return true;}catch(e){
if(e !=Enumerator.StopIteration)throw e;return false;}
},
withIndex:function(start){
return this.izip(E(start || 0).countup());},
countup:function(){
var start=this.next()|| 0;return Enumerator(function(){return start++});}
};Enumerator.prototype.to_a=Enumerator.prototype.toArray;Enumerator.prototype.each=Enumerator.prototype.map;Enumerator.prototype.inject=Enumerator.prototype.reduce;Enumerator.prototype.ifilter=Enumerator.prototype.iselect;Enumerator.StopIteration=new Error("StopIteration");
