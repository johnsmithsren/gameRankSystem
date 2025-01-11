import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Rank extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ default: 0 })
  score: number;
}

export const RankSchema = SchemaFactory.createForClass(Rank);
